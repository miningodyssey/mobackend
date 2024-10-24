import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { User } from '../users/entity/user.entity';
import { Task } from './entity/tasks.entity';
import { CreateTaskDto } from './dto/CreateTask.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
      @InjectRepository(Task)
      private taskRepository: Repository<Task>,
      @InjectRepository(User)
      private userRepository: Repository<User>,
      private readonly usersService: UsersService,
      @InjectRedis() private readonly redis: Redis,
  ) {}

  async createTask(taskData: CreateTaskDto) {
    await this.redis.select(1);

    const task = this.taskRepository.create({
      ...taskData,
      startDate: taskData.startDate ? Math.floor(new Date(taskData.startDate).getTime() / 1000) : null,
      endDate: taskData.endDate ? Math.floor(new Date(taskData.endDate).getTime() / 1000) : null,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.redis.set(`task:${savedTask.id}`, JSON.stringify(savedTask));
    return savedTask;
  }


  async getAllTasks(userId: string): Promise<Task[]> {
    await this.redis.select(1);
    const cachedTasks = await this.redis.get('tasks');

    const user = await this.usersService.getUser(userId);
    const completedTaskIds = user.completedTaskIds || [];

    let tasks: Task[] = [];

    if (cachedTasks) {
      tasks = JSON.parse(cachedTasks);
    } else {
      tasks = await this.taskRepository.find();
      if (tasks.length > 0) {
        this.redis.set('tasks', JSON.stringify(tasks));
      }
    }

    return tasks.filter((task) => !completedTaskIds.includes(task.id));
  }

  async completeTask(userId: string, taskId: string) {
    await this.redis.select(1);
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
  async updateTaskProgress(userId: string, taskId: string, increment: number) {
    await this.redis.select(1);

    const key = `user:${userId}:task:${taskId}:progress`;

    let currentProgress = Number(await this.redis.get(key));
    if (currentProgress) {
      currentProgress = Number(currentProgress)
    } else {
      currentProgress = 0
    }

    const newProgress = currentProgress + increment;
    await this.redis.set(key, newProgress);

    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (task && newProgress >= task.targetValue) {
      await this.redis.set(`user:${userId}:task:${taskId}:completed`, 'true');
    }
  }

  async getTaskProgress(userId: string, taskId: string) {
    const key = `user:${userId}:task:${taskId}:progress`;
    const progress = await this.redis.get(key);
    return progress ? parseInt(progress) : 0;
  }
}
