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
  async updateUser(userId: number, updateData: Partial<User>) {
    // Обновляем данные пользователя в базе данных
    await this.userRepository.update(userId, updateData);

    // Получаем текущие данные пользователя из Redis
    const cachedUserData = await this.redis.get(`user:${userId}`);

    if (cachedUserData) {
      // Парсим данные из Redis
      const user = JSON.parse(cachedUserData);

      // Обновляем данные в кэше
      const updatedUser = { ...user, ...updateData };

      // Сохраняем обновленные данные в Redis
      await this.redis.set(`user:${userId}`, JSON.stringify(updatedUser));
    } else {
      // Если данные не были закешированы, можно заново закешировать их из БД
      const userFromDb = await this.userRepository.findOne({ where: { id: userId } });
      if (userFromDb) {
        await this.redis.set(`user:${userId}`, JSON.stringify(userFromDb));
      }
    }
  }

  async createUserIfNotExists(
      userId: number,
      userData: Partial<User>,
  ): Promise<User> {
    const { referer, ...restUserData } = userData;

    let user = await this.getUser(userId);

    // Если пользователь существует, но у него еще не был установлен реферер
    if (user && !user.referer && referer) {
      const refererProfile = await this.getUser(Number(referer));
      if (refererProfile) {
        // Увеличиваем количество рефералов у реферера
        refererProfile.referals += 1;
        // Увеличиваем баланс реферера на 500
        refererProfile.balance = Number(refererProfile.balance) + 500;
        await this.userRepository.save(refererProfile);
        await this.redis.set(`user:${referer}`, JSON.stringify(refererProfile));

        // Устанавливаем реферера и увеличиваем баланс пользователя (реферала) на 500
        user.referer = referer;
        user.balance = Number(user.balance) + 500;
        await this.userRepository.save(user);
        await this.redis.set(`user:${userId}`, JSON.stringify(user));
      }
    } else if (!user) {
      // Создаем нового пользователя, если он не существует
      user = this.userRepository.create({
        id: userId,
        referer,
        ...restUserData,
      });

      if (referer) {
        const refererProfile = await this.getUser(Number(referer));
        if (refererProfile) {
          // Увеличиваем количество рефералов у реферера
          refererProfile.referals += 1;
          // Увеличиваем баланс реферера на 500
          refererProfile.balance = Number(refererProfile.balance) + 500;
          await this.userRepository.save(refererProfile);
          await this.redis.set(`user:${referer}`, JSON.stringify(refererProfile));

          // Увеличиваем баланс реферала (нового пользователя) на 500
          user.balance = 500;
        }
      }

      await this.userRepository.save(user);
      await this.redis.set(`user:${userId}`, JSON.stringify(user));
    }

    return user;
  }

}
