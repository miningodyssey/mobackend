import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', default: 500 })
  reward: number;

  @Column()
  taskDescription: string;

  @Column()
  imageLink: string;

  @Column()
  taskLink: string;
}
