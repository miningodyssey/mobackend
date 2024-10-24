import {User} from "../entity/user.entity";
import {UserType} from "../types/user.type";

export const toUserType = (user: User): UserType => {
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
    } = user;
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
        admin,
        selectedSkin: '',
        selectedUpgrade: '',
        settings: '',
        energy: 10,
        lastUpdated: Date.now()
    };
}

