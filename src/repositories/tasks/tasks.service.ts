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
    const task = await this.taskRepository.save(taskData);
    this.redis.set(`task:${task.id}`, JSON.stringify(task));
    return task;
  }

  async getAllTasks(userId: string): Promise<Task[]> {
    // Получаем задачи из кеша
    const cachedTasks = await this.redis.get('tasks');

    // Получаем пользователя и его выполненные задачи
    const user = await this.usersService.getUser(userId);
    const completedTaskIds = user.completedTaskIds || [];

    if (cachedTasks) {
      // Если задачи есть в кеше, то фильтруем их
      const tasks: Task[] = JSON.parse(cachedTasks);
      return tasks.filter((task) => !completedTaskIds.includes(task.id));
    }

    // Получаем все задачи из репозитория
    const tasks = await this.taskRepository.find();

    if (tasks.length > 0) {
      // Кешируем полученные задачи
      this.redis.set('tasks', JSON.stringify(tasks));
    }

    // Фильтруем задачи, исключая выполненные
    return tasks.filter((task) => !completedTaskIds.includes(task.id));
  }

  async completeTask(userId: string, taskId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (user && task) {
      if (!user.completedTaskIds.includes(taskId)) {
        user.completedTaskIds.push(taskId);

        user.balance = user.balance + Number(task.reward);

        await this.userRepository.save(user);
      }
    }
  }
}
