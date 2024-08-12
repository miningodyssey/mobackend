import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { taskAction } from '../interfaces/taskAction.interface';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', default: 500 })
  reward: number;

  @Column({ nullable: false })
  taskDescription: string;

  @Column({ nullable: false })
  imageLink: string;

  @Column({ nullable: false })
  taskAction: taskAction;

  @Column({ nullable: false })
  taskLink: string;
}
