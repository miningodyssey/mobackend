import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 500 })
  reward: number;

  @Column({ type: 'text', default: 'Default title' })
  taskTitle: string;


  @Column({ type: 'text', default: 'Default description' })
  taskDescription: string;

  @Column({ type: 'text', nullable: true })
  imageLink?: string;

  @Column({ type: 'text', nullable: true })
  taskLink?: string;

  @Column({ type: 'enum', enum: ['regular', 'daily', 'temporary'], default: 'regular' })
  type: 'regular' | 'daily' | 'temporary';

  @Column({ type: 'int', nullable: true })
  startDate?: number;

  @Column({ type: 'int', nullable: true })
  endDate?: number;

  @Column({ type: 'enum', enum: ['click', 'points', 'invite'], default: 'click' })
  actionType: 'click' | 'points' | 'invite'; // Вид действия

  @Column({ type: 'int', default: 0 })
  targetValue: number; // Целевое значение (например, количество кликов, очков или друзей)
}
