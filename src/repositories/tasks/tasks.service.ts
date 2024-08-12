import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Task } from './entity/tasks.entity';
import { User } from '../users/entity/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private userRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  createTask(taskData: Partial<Task>) {
    this.taskRepository.save(taskData);
    this.redis.set(`task:${taskData.id}`, JSON.stringify(taskData));
  }
  async getAllTasks(): Promise<Task[]> {
    const cachedTasks = await this.redis.get(`task:*`);
    if (cachedTasks) {
      return JSON.parse(cachedTasks);
    }

    const tasks = await this.taskRepository.find();
    if (tasks) {
      for (const task of tasks) {
        this.redis.set(`task:${task.id}`, JSON.stringify(task));
      }
    }

    return tasks;
  }
  async completeTask(userId: number, taskId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (user && task) {
      if (!user.completedTaskIds.includes(taskId)) {
        user.completedTaskIds.push(taskId);

        user.balance += task.reward;

        this.userRepository.save(user);
      }
    }
  }
}
