import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
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

  @Column({ nullable: true })
  upgrades: string;

  @Column({ type: 'decimal', default: 0 })
  personalRecord: number;

  @Column({ type: 'simple-array', default: [] })
  completedTaskIds: string[];
}
