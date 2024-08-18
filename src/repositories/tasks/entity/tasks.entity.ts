import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', default: '500' })
  reward: string;

  @Column({ type: 'text', default: 'Default description' })
  taskDescription: string;

  @Column({ type: 'text', default: 'Default description' })
  imageLink: string;

  @Column({ type: 'text', default: 'Default description' })
  taskLink: string;
}
