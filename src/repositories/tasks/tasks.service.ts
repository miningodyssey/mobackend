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

    const user = await this.usersService.getUser(userId);
    const completedTaskIds = user.completedTaskIds || [];

    const lastDailyUpdateKey = `user:${userId}:lastDailyUpdate`;
    const lastDailyUpdate = await this.redis.get(lastDailyUpdateKey);
    const currentDate = new Date().toISOString().split('T')[0];

    if (lastDailyUpdate !== currentDate) {
      await this.initializeDailyTasksForUser(userId);
      await this.redis.set(lastDailyUpdateKey, currentDate);
    }

    const cachedTasks = await this.redis.get('tasks');
    let tasks: Task[] = [];

    if (cachedTasks) {
      tasks = JSON.parse(cachedTasks);
    } else {
      tasks = await this.taskRepository.find();
      if (tasks.length > 0) {
        await this.redis.set('tasks', JSON.stringify(tasks));
      }
    }

    return tasks.filter((task) => !completedTaskIds.includes(task.id));
  }

  private async initializeDailyTasksForUser(userId: string) {
    await this.redis.select(1);

    const dailyTasks = await this.taskRepository.find({ where: { type: 'daily' } });

    const taskKey = `user:${userId}:tasks`;

    for (const task of dailyTasks) {
      const taskData = {
        progress: 0,
        completed: false,
      };
      await this.redis.hset(taskKey, task.id, JSON.stringify(taskData));
    }
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

    const taskKey = `user:${userId}:tasks`;

    const taskData = await this.redis.hget(taskKey, taskId);
    let currentProgress = 0;
    let isCompleted = false;
    let taskType = '';

    if (taskData) {
      const parsedTaskData = JSON.parse(taskData);
      currentProgress = parsedTaskData.progress;
      isCompleted = parsedTaskData.completed;
      taskType = parsedTaskData.type;
    }

    currentProgress += increment;

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (task && currentProgress >= task.targetValue) {
      isCompleted = true;
    }

    // Если данные о задаче отсутствуют в Redis, получаем тип задачи из базы
    if (!taskType && task) {
      taskType = task.type;
    }

    await this.redis.hset(
        taskKey,
        taskId,
        JSON.stringify({ progress: currentProgress, completed: isCompleted, type: taskType }),
    );

    if (isCompleted) {
      await this.redis.hset(taskKey, `${taskId}:completed`, 'true');
    }
  }


  async getTaskProgress(userId: string, taskId: string) {
    const taskKey = `user:${userId}:tasks`;
    const taskData = await this.redis.hget(taskKey, taskId);

    if (!taskData) {
      return { progress: 0, completed: false };
    }

    const parsedTaskData = JSON.parse(taskData);
    return { progress: parsedTaskData.progress, completed: parsedTaskData.completed };
  }

  async initializeTasksForNewUser(userId: string) {
    await this.redis.select(1);

    // Получаем все активные задачи
    const activeTasks = await this.taskRepository.find();

    // Создаем ключ для хранения задач пользователя
    const taskKey = `user:${userId}:tasks`;

    // Инициализируем задачи с нулевым прогрессом, статусом "не выполнено" и типом задачи
    for (const task of activeTasks) {
      const taskData = {
        progress: 0,
        completed: false,
        type: task.type,
      };
      await this.redis.hset(taskKey, task.id, JSON.stringify(taskData));
    }
  }


}
