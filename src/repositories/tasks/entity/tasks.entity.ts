import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', default: 500 })
  reward: number;

  @Column({ type: 'text', default: 'Default description' })
  taskDescription: string;

  @Column({ type: 'text', default: 'Default description' })
  imageLink: string;

  @Column({ type: 'text', default: 'Default description' })
  taskLink: string;
}
