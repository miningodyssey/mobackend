import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { User } from '../users/entity/user.entity';
import { Task } from './entity/tasks.entity';
import { CreateTaskDto } from './dto/CreateTask.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async createTask(taskData: CreateTaskDto) {
    const task = await this.taskRepository.save(taskData);
    this.redis.set(`task:${task.id}`, JSON.stringify(task));
    return task;
  }

  async getAllTasks(): Promise<Task[]> {
    const cachedTasks = await this.redis.get('tasks');
    if (cachedTasks) {
      return JSON.parse(cachedTasks);
    }

    const tasks = await this.taskRepository.find();
    if (tasks) {
      this.redis.set('tasks', JSON.stringify(tasks));
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

        await this.userRepository.save(user);
      }
    }
  }
}
