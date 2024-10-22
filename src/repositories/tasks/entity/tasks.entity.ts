import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 500 })
  reward: number; // Вознаграждение лучше хранить в виде числа

  @Column({ type: 'text', default: 'Default description' })
  taskDescription: string;

  @Column({ type: 'text', nullable: true })
  imageLink?: string; // Можно сделать ссылку на изображение необязательной

  @Column({ type: 'text', nullable: true })
  taskLink?: string; // Ссылка на задачу также может быть необязательной

  @Column({ type: 'enum', enum: ['regular', 'daily', 'temporary'], default: 'regular' })
  type: 'regular' | 'daily' | 'temporary'; // Добавляем тип задачи

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date; // Поле для временных задач, указывающее начало действия

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date; // Поле для временных задач, указывающее окончание действия

  @Column({ type: 'int', default: 0 })
  completionCount: number; // Отслеживание выполнений задачи
}
