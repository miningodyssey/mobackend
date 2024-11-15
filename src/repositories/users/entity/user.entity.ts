import { Entity, PrimaryColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['nickname'])
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ type: 'decimal', default: 0 })
  balance: number;

  @Column({ default: '0' })
  registrationDate: string;

  @Column({ default: 0 })
  referals: number;

  @Column({ default: '0' })
  referer: string;

  @Column({ nullable: true })
  tgUserdata: string;

  @Column({ type: 'simple-array', nullable: true })
  ownedSkins: string[];

  @Column({ type: 'simple-array', nullable: true })
  ownedWagons: string[];

  @Column({ type: 'simple-array', nullable: true })
  ownedSlideObstacles: string[];

  @Column({ type: 'simple-array', nullable: true })
  ownedJumpObstacles: string[];

  @Column({ type: 'simple-array', nullable: true })
  ownedselectedRoad: string[];

  @Column({ type: 'decimal', default: 0 })
  personalRecord: number;

  @Column({ type: 'simple-array', nullable: true })
  completedTaskIds: string[];

  @Column({ type: 'decimal', default: 0 })
  earnedMoney: number;

  @Column({ type: 'decimal', default: 0 })
  earnedByReferer: number;

  @Column({ type: 'boolean', default: false })
  admin: boolean;
}
