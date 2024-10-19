import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { User } from './entity/user.entity';
import Redis from 'ioredis';
import { UserType } from './types/user.type';
import { toUserType } from './utils/toUserType';
import { toUserEntity } from './utils/toUserEntity';
import { createUserType } from './types/createUser.type';

@Injectable()
export class UsersService {
  private readonly ENERGY_LIMIT = 10;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async initializeUserSettings(userId: string) {
    const defaultSettings = {
      theme: 'light', // Пример настройки темы
      notificationsEnabled: 'true', // Пример настройки уведомлений
    };

    // Проверяем, если ли уже сохранённые настройки
    const existingSettings = await this.redis.hgetall(
      `user:${userId}:settings`,
    );
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
      // Если настроек нет, то инициализируем с дефолтными значениями
      await this.redis.hmset(`user:${userId}:settings`, defaultSettings);
    }
    return defaultSettings;
  }

  // Получение настроек пользователя из Redis
  async getUserSettings(userId: string): Promise<Record<string, string>> {
    const settings = await this.redis.hgetall(`user:${userId}:settings`);
    if (!settings || Object.keys(settings).length === 0) {
      return null; // Возвращаем null, если настроек нет
    }
    return settings;
  }

  async updateUserSettings(
    userId: string,
    newSettings: Record<string, string>,
  ) {
    // Обновляем каждую настройку в Redis
    for (const key in newSettings) {
      await this.redis.hset(`user:${userId}:settings`, key, newSettings[key]);
    }
    return newSettings;
  }

  async getUser(userId: string): Promise<UserType> {
    const pipeline = this.redis.pipeline();
    pipeline.get(`user:${userId}`);
    pipeline.hgetall(`user:${userId}:energy`);
    pipeline.hget(`user:${userId}:energy`, 'lastUpdated');

    const results: [Error | null, unknown][] = await pipeline.exec();

    const [userError, cachedUser] = results[0];
    const [energyError, energyData] = results[1];
    const [lastUpdateError, lastEnergyUpdate] = results[2];

    if (userError || energyError || lastUpdateError) {
      throw new Error('Error fetching data from Redis');
    }

    let userType: UserType;

    if (cachedUser && typeof cachedUser === 'string') {
      userType = JSON.parse(cachedUser as string);

      // Если данных о энергии нет, инициализируем
      if (!energyData || Object.keys(energyData as object).length === 0) {
        await this.redis.hset(
          `user:${userId}:energy`,
          'energy',
          '10',
          'lastUpdated',
          Date.now().toString(),
        );
      } else {
        const lastUpdatedTime =
          lastEnergyUpdate && typeof lastEnergyUpdate === 'string'
            ? parseInt(lastEnergyUpdate as string, 10)
            : Date.now();
        await this.updateEnergy(userId, lastUpdatedTime);
      }

      userType.energy = parseInt(
        await this.redis.hget(`user:${userId}:energy`, 'energy'),
        10,
      );
      userType.lastUpdated = Date.now();
      userType.remainingTime =
        await this.getRemainingTimeUntilNextEnergy(userId);
      userType.settings = await this.getUserSettings(userId);
      const selected = await this.getUserSelections(userId);
      userType = {
        ...userType,
        selectedSkin: selected.selectedSkin,
        selectedUpgrade: selected.selectedUpgrade,
      };
      return userType;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      userType = toUserType(user);
      await this.redis.set(`user:${userId}`, JSON.stringify(userType));

      const energyDataExists = await this.redis.hgetall(
        `user:${userId}:energy`,
      );
      if (!energyDataExists || Object.keys(energyDataExists).length === 0) {
        await this.redis.hset(
          `user:${userId}:energy`,
          'energy',
          '10',
          'lastUpdated',
          Date.now().toString(),
        );
      } else {
        const lastUpdatedTime =
          lastEnergyUpdate && typeof lastEnergyUpdate === 'string'
            ? parseInt(lastEnergyUpdate as string, 10)
            : Date.now();
        await this.updateEnergy(userId, lastUpdatedTime);
      }

      userType.energy = parseInt(
        await this.redis.hget(`user:${userId}:energy`, 'energy'),
        10,
      );
      userType.lastUpdated = Date.now();
      userType.remainingTime =
        await this.getRemainingTimeUntilNextEnergy(userId);

      return userType;
    }

    return null;
  }

  private async updateEnergy(
    userId: string,
    lastEnergyUpdate: number,
  ): Promise<void> {
    const currentTime = Date.now();
    const hoursPassed = Math.floor(
      (currentTime - lastEnergyUpdate) / (4 * 60 * 60 * 1000),
    );

    if (hoursPassed > 0) {
      await this.manuallyAddEnergy(userId, hoursPassed);
      await this.redis.hset(
        `user:${userId}:energy`,
        'lastUpdated',
        currentTime.toString(),
      );
    }
  }

  async updateUser(userId: string, updateData: UserType) {
    try {
      await this.userRepository.update(userId, toUserEntity(updateData));
      this.redis.del(`user:${userId}`);
      return updateData;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Nickname already in use');
      }
      throw error;
    }
  }

  async createUserIfNotExists(
    userId: string,
    userData: createUserType,
  ): Promise<UserType> {
    let { referer } = userData;

    if (referer === userId) {
      referer = '0';
    }

    let user = await this.getUser(userId);

    if (user) {
      if (user.referer === '0' && referer) {
        const refererProfile = await this.getUser(referer);
        if (refererProfile) {
          await this.updateRefererAndUserBalances(
            user,
            refererProfile,
            referer,
          );
        }
      }

      if (!user.selectedSkin) {
        const selections = await this.getUserSelections(userId);
        user.selectedSkin = selections?.selectedSkin || 'defaultSkin';
        await this.redis.hset(
          `user:${userId}`,
          'selectedSkin',
          user.selectedSkin,
        );
      }

      if (!user.selectedUpgrade) {
        const selections = await this.getUserSelections(userId);
        user.selectedUpgrade = selections?.selectedUpgrade || 'defaultUpgrade';
        await this.redis.hset(
          `user:${userId}`,
          'selectedUpgrade',
          user.selectedUpgrade,
        );
      }
    } else {
      const selections = await this.getUserSelections(userId);
      const selectedSkin = selections?.selectedSkin || 'defaultSkin';
      const selectedUpgrade = selections?.selectedUpgrade || 'defaultUpgrade';

      user = this.createNewUser(
        userId,
        referer,
        selectedSkin,
        selectedUpgrade,
        userData.tgUserdata,
        userData.registrationDate,
      );
      await this.saveUserToDatabase(user);

      user.settings = await this.initializeUserSettings(userId);

      if (referer) {
        const refererProfile = await this.getUser(referer);
        if (refererProfile) {
          await this.updateRefererAndUserBalances(
            user,
            refererProfile,
            referer,
          );
        }
      }
    }

    user.remainingTime = await this.getRemainingTimeUntilNextEnergy(userId);
    return user;
  }

  private createNewUser(
    userId: string,
    referer: string,
    selectedSkin: string,
    selectedUpgrade: string,
    tgUserdata: string,
    registrationDate: string,
  ): UserType {
    return {
      personalRecord: 0,
      id: userId,
      referer,
      energy: 10,
      lastUpdated: Date.now(),
      nickname: '',
      remainingTime: 0,
      selectedSkin,
      selectedUpgrade,
      settings: undefined,
      balance: 5000,
      referals: 0,
      ownedUpgrades: [],
      ownedSkins: [],
      completedTaskIds: [],
      earnedMoney: 0,
      earnedByReferer: 0,
      registrationDate: registrationDate,
      tgUserdata: tgUserdata,
    };
  }

  private async saveUserToDatabase(user: UserType) {
    await Promise.all([
      this.userRepository.save(toUserEntity(user)),
      this.redis.set(`user:${user.id}`, JSON.stringify(user)),
      this.redis.hset(`user:${user.id}:energy`, 'energy', '10'),
      this.redis.hset(
        `user:${user.id}:energy`,
        'lastUpdated',
        Date.now().toString(),
      ),
      this.redis.hset(`user:${user.id}`, 'selectedSkin', user.selectedSkin),
      this.redis.hset(
        `user:${user.id}`,
        'selectedUpgrade',
        user.selectedUpgrade,
      ),
    ]);
  }

  private async updateRefererAndUserBalances(
    user: UserType,
    refererProfile: UserType,
    referer: string,
  ) {
    refererProfile.referals += 1;
    refererProfile.balance += 5000;
    user.referer = referer;
    user.balance += 5000;
    user.earnedByReferer += 5000;

    await Promise.all([
      this.userRepository.save(toUserEntity(refererProfile)),
      this.userRepository.save(toUserEntity(user)),
      this.redis.set(`user:${referer}`, JSON.stringify(refererProfile)),
      this.redis.set(`user:${user.id}`, JSON.stringify(user)),
    ]);
  }

  async saveUserSelections(
    userId: string,
    selectedUpgrade: string,
    selectedSkin: string,
  ) {
    const pipeline = this.redis.pipeline();

    pipeline.hset(
      `user:${userId}:selections`,
      'selectedUpgrade',
      selectedUpgrade,
    );

    // Сохраняем выбранный скин
    pipeline.hset(`user:${userId}:selections`, 'selectedSkin', selectedSkin);

    await pipeline.exec();
  }

  async getUserSelections(
    userId: string,
  ): Promise<{ selectedUpgrade: string; selectedSkin: string }> {
    const selections = await this.redis.hgetall(`user:${userId}:selections`);

    return {
      selectedUpgrade: selections.selectedUpgrade || '',
      selectedSkin: selections.selectedSkin || '',
    };
  }

  async finishRunAndUpdateTop(
    userId: string,
    coinsEarned: number,
  ): Promise<void> {
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

    const timeToNextEnergy = 4 * 60 * 60 * 1000 - elapsedTime;
    return Math.max(timeToNextEnergy, 0);
  }

  async manuallyAddEnergy(
    userId: string,
    amount: number,
  ): Promise<{ energy: number; lastUpdated: string }> {
    const energyData = await this.redis.hgetall(`user:${userId}:energy`);

    if (!energyData || Object.keys(energyData).length === 0) {
      throw new Error(`User not found.`);
    }

    const currentEnergy = parseInt(energyData.energy, 10);
    const newEnergy = Math.min(currentEnergy + amount, this.ENERGY_LIMIT);
    const updateDate = Date.now().toString();
    await this.redis.hset(
      `user:${userId}:energy`,
      'energy',
      newEnergy.toString(),
    );
    await this.redis.hset(`user:${userId}:energy`, 'lastUpdated', updateDate); // Обновляем время

    return { energy: newEnergy, lastUpdated: updateDate }; // Возвращаем обновленное значение энергии
  }

  async getTop(
    userId: string,
  ): Promise<{ userPosition: number; topTen: any[] }> {
    const globalTop = await this.redis.zrevrange(
      'globalTop',
      0,
      -1,
      'WITHSCORES',
    );
    let userPosition = -1;
    const topTen: { id: string; nickname: string; balance: number }[] = [];

    if (globalTop.length > 0) {
      for (let i = 0; i < globalTop.length; i += 2) {
        const nickname = globalTop[i];
        const balance = parseFloat(globalTop[i + 1]);

        let user = await this.userRepository.findOne({ where: { nickname } });

        if (!user) {
          user = await this.userRepository.findOne({ where: { id: nickname } });
        }

        if (user) {
          const nicknameToUse = user.nickname || user.id;

          if (topTen.length < 10) {
            topTen.push({ id: user.id, nickname: nicknameToUse, balance });
          }

          if (nickname === userId || user.id === userId) {
            userPosition = i / 2 + 1;
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
          topTen.push({
            id: user.id,
            nickname: nicknameToUse,
            balance: user.balance,
          });
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

  async getFriendsTop(userId: string): Promise<UserType[]> {
    const cachedReferals = await this.redis.get(`allFriends:${userId}`);
    if (cachedReferals) {
      return JSON.parse(cachedReferals);
    }

    const referals = await this.userRepository
      .createQueryBuilder('user')
      .where('user.referer = :userId', { userId })
      .orderBy('user.balance', 'DESC')
      .getMany();

    const referalsUserType = referals.map(toUserType);
    await this.redis.set(
      `allFriends:${userId}`,
      JSON.stringify(referalsUserType),
    );
    return referalsUserType;
  }

  async getReferalsTop(userId: string): Promise<UserType[]> {
    const cachedReferals = await this.redis.get(`allReferals:${userId}`);
    if (cachedReferals) {
      return JSON.parse(cachedReferals);
    }

    const referals = await this.userRepository
      .createQueryBuilder('user')
      .where('user.referer = :userId', { userId })
      .orderBy('user.earnedByReferer', 'DESC')
      .getMany();

    const referalsUserType = referals.map(toUserType);
    await this.redis.set(
      `allReferals:${userId}`,
      JSON.stringify(referalsUserType),
    );
    return referalsUserType;
  }
}
