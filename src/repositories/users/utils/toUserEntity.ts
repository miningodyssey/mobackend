// Преобразование из UserType в entity User
import { UserType } from '../types/user.type';
import { User } from '../entity/user.entity';

export const toUserEntity = (user: UserType): User => {
  const {
    id,
    nickname,
    balance,
    registrationDate,
    referals,
    referer,
    tgUserdata,
    ownedSlideObstacles,
    ownedSkins,
    ownedJumpObstacles,
    ownedWagons,
    ownedselectedRoad,
    personalRecord,
    completedTaskIds,
    earnedMoney,
    earnedByReferer,
    admin,
  } = user;
  return {
    id,
    nickname,
    balance,
    registrationDate,
    referals,
    referer,
    tgUserdata,
    ownedSlideObstacles,
    ownedSkins,
    ownedJumpObstacles,
    ownedWagons,
    ownedselectedRoad,
    personalRecord,
    completedTaskIds,
    earnedMoney,
    earnedByReferer,
    admin,
  };
};
