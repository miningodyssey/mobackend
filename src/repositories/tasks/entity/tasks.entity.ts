import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', default: 500 })
  reward: number;

  @Column({ type: 'string', default: 'Default description' })
  taskDescription: string;

  @Column({ type: 'string', default: 'Default description' })
  imageLink: string;

  @Column({ type: 'string', default: 'Default description' })
  taskLink: string;
}
