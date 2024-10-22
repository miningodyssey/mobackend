
// Преобразование из UserType в entity User
import {UserType} from "../types/user.type";
import {User} from "../entity/user.entity";

export const toUserEntity = (user: UserType): User => {
    const {
        id,
        nickname,
        balance,
        registrationDate,
        referals,
        referer,
        tgUserdata,
        ownedUpgrades,
        ownedSkins,
        personalRecord,
        completedTaskIds,
        earnedMoney,
        earnedByReferer,
        admin
    }
        = user;
    return {
        id,
        nickname,
        balance,
        registrationDate,
        referals,
        referer,
        tgUserdata,
        ownedUpgrades,
        ownedSkins,
        personalRecord,
        completedTaskIds,
        earnedMoney,
        earnedByReferer,
        admin
    };
}