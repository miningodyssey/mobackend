import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', default: 500 })
  reward: number;

  @Column({ default: 'Default description' })
  taskDescription: string;

  @Column({ default: 'Default description' })
  imageLink: string;

  @Column({ default: 'Default description' })
  taskLink: string;
}
