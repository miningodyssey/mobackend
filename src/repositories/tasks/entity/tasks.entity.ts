import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 500 })
  reward: number;

  @Column({ type: 'text', default: 'Default description' })
  taskDescription: string;

  @Column({ type: 'text', nullable: true })
  imageLink?: string;

  @Column({ type: 'text', nullable: true })
  taskLink?: string;

  @Column({ type: 'enum', enum: ['regular', 'daily', 'temporary'], default: 'regular' })
  type: 'regular' | 'daily' | 'temporary';

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'int', default: 0 })
  completionCount: number;
}
