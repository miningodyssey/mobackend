import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { User } from './entity/user.entity';
import Redis from 'ioredis';
import { UserType } from './types/user.type';
import { toUserType } from "./utils/toUserType";
import { toUserEntity } from "./utils/toUserEntity";

@Injectable()
export class UsersService {
    private readonly ENERGY_LIMIT = 10;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async getUser(userId: string): Promise<UserType> {
        const cachedUser = await this.redis.get(`user:${userId}`);
        if (cachedUser) {
            return JSON.parse(cachedUser);
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
            const userType = toUserType(user);
            await this.redis.set(`user:${userId}`, JSON.stringify(userType));
            return userType;
        }

        return null;
    }

    async updateUser(userId: string, updateData: UserType) {
        await this.userRepository.update(userId, toUserEntity(updateData));
        this.redis.del(`user:${userId}`);
    }

    async createUserIfNotExists(userId: string, userData: UserType): Promise<UserType> {
        let { referer, settings, selectedSkin, selectedUpgrade, ...restUserData } = userData;

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

        user.remainingTime = await this.getRemainingTimeUntilNextEnergy(userId);

        return user;
    }

    async finishRunAndUpdateTop(userId: string, coinsEarned: number): Promise<void> {
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

    async getRemainingTimeUntilNextEnergy(userId: string): Promise<number> {
        const energyData = await this.redis.hgetall(`user:${userId}:energy`);
        if (!energyData || !energyData.lastUpdated) {
            return 0;
        }

        const lastUpdated = parseInt(energyData.lastUpdated, 10);
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastUpdated;

        const timeToNextEnergy = (4 * 60 * 60 * 1000) - elapsedTime; // 4 часа в миллисекундах
        return Math.max(timeToNextEnergy, 0); // Возвращаем оставшееся время, не меньше 0
    }


    async manuallyAddEnergy(userId: string, amount: number): Promise<{ energy: number }> {
        const energyData = await this.redis.hgetall(`user:${userId}:energy`);

        if (!energyData || Object.keys(energyData).length === 0) {
            throw new Error(`Пользователь с id ${userId} не найден или данные о энергии отсутствуют.`);
        }

        const currentEnergy = parseInt(energyData.energy, 10);
        const newEnergy = Math.min(currentEnergy + amount, this.ENERGY_LIMIT);

        await this.redis.hset(`user:${userId}:energy`, 'energy', newEnergy.toString());
        await this.redis.hset(`user:${userId}:energy`, 'lastUpdated', Date.now().toString()); // Обновляем время

        return { energy: newEnergy }; // Возвращаем обновленное значение энергии
    }

    async getTop(userId: string): Promise<{ userPosition: number; topTen: any[] }> {
        const globalTop = await this.redis.zrevrange('globalTop', 0, -1, 'WITHSCORES');
        console.log(globalTop)
        let userPosition = -1;
        const topTen: { id: string; nickname: string; balance: number }[] = [];

        if (globalTop.length > 0) {
            for (let i = 0; i < globalTop.length; i += 2) {
                const nickname = globalTop[i];
                const balance = parseFloat(globalTop[i + 1]);

                const user = await this.userRepository.findOne({ where: { nickname } });

                if (user) {
                    if (topTen.length < 10) {
                        topTen.push({ id: user.id, nickname, balance });
                    }

                    if (nickname === userId) {
                        userPosition = (i / 2) + 1;
                    }
                }
            }
        } else {
            const users = await this.userRepository
                .createQueryBuilder('user')
                .select(['user.id', 'user.nickname', 'user.balance'])
                .orderBy('user.balance', 'DESC')
                .getMany();

            for (const user of users) {
                const nicknameToUse = user.nickname || user.id;
                await this.redis.zadd('globalTop', user.balance, nicknameToUse);
                if (topTen.length < 10) {
                    topTen.push({ id: user.id, nickname: nicknameToUse, balance: user.balance });
                }
            }

            const currentUser = await this.getUser(userId);
            const nicknameToUse = currentUser.nickname || currentUser.id;
            userPosition = await this.redis.zrevrank('globalTop', nicknameToUse);
            if (userPosition !== null) {
                userPosition += 1;
            }
        }

        return { userPosition, topTen };
    }



    async getReferalsTop(userId: string): Promise<UserType[]> {
        const cachedReferals = await this.redis.get(`allReferals:${userId}`);
        if (cachedReferals) {
            return JSON.parse(cachedReferals);
        }

        const referals = await this.userRepository
            .createQueryBuilder('user')
            .where('user.referer = :userId', { userId })
            .orderBy('user.balance', 'DESC')
            .limit(10)
            .getMany();

        const referalsUserType = referals.map(toUserType);
        await this.redis.set(`allReferals:${userId}`, JSON.stringify(referalsUserType));
        return referalsUserType;
    }
}
