import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {InjectRedis} from '@nestjs-modules/ioredis';
import {User} from './entity/user.entity';
import Redis from 'ioredis';
import {Cron} from '@nestjs/schedule';
import {UserType} from './types/user.type';
import {toUserType} from "./utils/toUserType";
import {toUserEntity} from "./utils/toUserEntity";

@Injectable()
export class UsersService {
    private readonly ENERGY_LIMIT = 10;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRedis() private readonly redis: Redis,
    ) {
    }

    // Преобразование из entity User в UserType

    async getUser(userId: string): Promise<UserType> {
        await this.redis.select(0);
        const cachedUser = await this.redis.get(`user:${userId}`);
        if (cachedUser) {
            return JSON.parse(cachedUser);
        }

        const user = await this.userRepository.findOne({where: {id: userId}});
        if (user) {
            const userType = toUserType(user);
            await this.redis.set(`user:${userId}`, JSON.stringify(userType));
            return userType;
        }

        return null;
    }

    async updateUser(userId: string, updateData: UserType) {
        await this.redis.select(0);
        await this.userRepository.update(userId, toUserEntity(updateData));

        const cachedUserData = await this.redis.get(`user:${userId}`);
        if (cachedUserData) {
            const user = JSON.parse(cachedUserData);
            const updatedUser = {...user, ...updateData};
            await this.redis.set(`user:${userId}`, JSON.stringify(updatedUser));
        } else {
            const userFromDb = await this.userRepository.findOne({where: {id: userId}});
            if (userFromDb) {
                await this.redis.set(`user:${userId}`, JSON.stringify(toUserType(userFromDb)));
            }
        }
    }

    async createUserIfNotExists(userId: string, userData: UserType): Promise<UserType> {
        await this.redis.select(0);
        let {referer, settings, selectedSkin, selectedUpgrade, ...restUserData} = userData;

        if (referer === userId) {
            referer = '0';
        }

        let user = await this.getUser(userId);

        if (user && user.referer === '0' && referer) {
            const refererProfile = await this.getUser(referer);
            if (refererProfile) {
                refererProfile.referals += 1;
                refererProfile.balance += 5000;
                await this.userRepository.save(toUserEntity(refererProfile));
                await this.redis.set(`user:${referer}`, JSON.stringify(refererProfile));

                user.referer = referer;
                user.balance += 5000;
                await this.userRepository.save(toUserEntity(user));
                await this.redis.set(`user:${userId}`, JSON.stringify(user));
            }
        } else if (!user) {
            user = {
                id: userId,
                referer,
                balance: 5000,
                energy: 10,
                referals: 0,
                settings: settings || '',
                selectedSkin: selectedSkin || '',
                selectedUpgrade: selectedUpgrade || '',
                ...restUserData,
            };

            await this.userRepository.save(toUserEntity(user));
            await this.redis.set(`user:${userId}`, JSON.stringify(user));

            if (referer) {
                const refererProfile = await this.getUser(referer);
                if (refererProfile) {
                    refererProfile.referals += 1;
                    refererProfile.balance += 5000;
                    await this.userRepository.save(toUserEntity(refererProfile));
                    await this.redis.set(`user:${referer}`, JSON.stringify(refererProfile));
                }
            }
        }

        return user;
    }

    async replenishEnergy(userId: string): Promise<void> {
        await this.redis.select(0);
        const cachedUser = await this.redis.get(`user:${userId}`);
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            if (user.energy < this.ENERGY_LIMIT) {
                user.energy += 1;
                await this.redis.set(`user:${userId}`, JSON.stringify(user));
            }
        }
    }

    async finishRunAndUpdateTop(userId: string, coinsEarned: number): Promise<void> {
        await this.redis.select(3);
        const user = await this.getUser(userId);

        user.balance += coinsEarned;
        await this.userRepository.save(toUserEntity(user));

        if (user.referer !== '0') {
            const referer = await this.getUser(user.referer);
            const refererBonus = coinsEarned * 0.1;

            referer.balance += refererBonus;
            await this.userRepository.save(toUserEntity(referer));
            await this.redis.set(`user:${referer.id}`, JSON.stringify(referer));
        }

        await this.redis.set(`user:${userId}`, JSON.stringify(user));
    }

    @Cron('0 */4 * * *') // каждые 4 часа
    async periodicallyReplenishEnergy(): Promise<void> {
        const keys = await this.redis.keys('user:*');
        for (const key of keys) {
            const userId = key.split(':')[1];
            await this.replenishEnergy(userId);
        }
    }

    async getTop(userId: string): Promise<{ userPosition: number; topTen: any[] }> {
        await this.redis.select(3);
        const cachedTop = await this.redis.get('globalTop');
        let globalTop: {
            position: number;
            nickname: string;
            balance: number
        }[] = cachedTop ? JSON.parse(cachedTop) : [];
        const user = await this.getUser(userId);
        const userInTop = globalTop.find(player => player.nickname === user.nickname);
        let userPosition = userInTop ? userInTop.position : -1;

        const topTen = globalTop.slice(0, 10);
        return {userPosition, topTen};
    }

    async getReferalsTop(userId: string): Promise<UserType[]> {
        await this.redis.select(3);
        const cachedReferals = await this.redis.get(`allReferals:${userId}`);
        if (cachedReferals) {
            return JSON.parse(cachedReferals);
        }

        const referals = await this.userRepository
            .createQueryBuilder('user')
            .where('user.referer = :userId', {userId})
            .orderBy('user.balance', 'DESC')
            .getMany();

        const referalsUserType = referals.map(toUserType);
        await this.redis.set(`allReferals:${userId}`, JSON.stringify(referalsUserType));
        return referalsUserType;
    }
}
