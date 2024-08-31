import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { User } from './entity/user.entity';
import Redis from 'ioredis';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getUser(userId: number): Promise<User> {
    const cachedUser = await this.redis.get(`user:${userId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      await this.redis.set(`user:${userId}`, JSON.stringify(user));
    }

    return user;
  }
  updateUser(userId: number, updateData: Partial<User>) {
    this.userRepository.update(userId, updateData);
    this.redis.del(`user:${userId}`);
  }
  async createUserIfNotExists(
    userId: number,
    userData: Partial<User>,
  ): Promise<User> {
    const { referer, ...restUserData } = userData;

    let user = await this.getUser(userId);
    if (referer && (!user || !user.referer)) {
      const refererProfile = await this.getUser(Number(referer));
      refererProfile.referals += 1;
      refererProfile.balance = Number(refererProfile.balance) + 500;
      await this.userRepository.save(refererProfile);
      await this.redis.set(`user:${referer}`, JSON.stringify(refererProfile));
    }
    if (!user) {
      user = this.userRepository.create({
        id: userId,
        referer,
        ...restUserData,
      });
      await this.userRepository.save(user);

      await this.redis.set(`user:${userId}`, JSON.stringify(user));
    }

    return user;
  }

}
