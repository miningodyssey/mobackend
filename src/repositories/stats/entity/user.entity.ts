import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'decimal', default: 0 })
  balance: number;

  @Column({ type: 'timestamp' })
  registrationDate: Date;

  @Column({ default: 0 })
  referals: number;

  @Column({ default: 0 })
  referer: number;

  @Column({ nullable: true })
  tgUserdata: string;

  @Column({ nullable: true })
  upgrades: string;

  @Column({ type: 'decimal', default: 0 })
  personalRecord: number;
}
