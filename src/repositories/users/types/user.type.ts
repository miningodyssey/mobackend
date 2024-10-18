export type UserType = {
  id: string;
  nickname?: string; // nullable
  balance: number;
  registrationDate: string;
  referals: number;
  referer: string;
  energy: number;
  tgUserdata?: string; // nullable
  ownedUpgrades: string[];
  ownedSkins: string[];
  lastUpdated: number;
  personalRecord: number;
  completedTaskIds: string[];
  earnedMoney: number;
  earnedByReferer: number;
  selectedUpgrade: string;
  selectedSkin: string;
  settings: any;
  remainingTime?: number;
};
