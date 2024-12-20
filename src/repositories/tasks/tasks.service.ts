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
    const task = this.taskRepository.create({
      ...taskData,
      startDate: taskData.startDate
        ? Math.floor(new Date(taskData.startDate).getTime() / 1000)
        : null,
      endDate: taskData.endDate
        ? Math.floor(new Date(taskData.endDate).getTime() / 1000)
        : null,
    });

    const savedTask = await this.taskRepository.save(task);
    await this.redis.del('tasks');

    await this.redis.set(`task:${savedTask.id}`, JSON.stringify(savedTask));
    return savedTask;
  }

  async getAllTasks(userId: string): Promise<any[]> {
    const lastDailyUpdateKey = `user:${userId}:lastDailyUpdate`;
    const lastDailyUpdate = await this.redis.get(lastDailyUpdateKey);
    const currentDate = new Date();

    // Инициализация ключа для задач пользователя
    const taskKey = `user:${userId}:tasks`;
    const userTasksData = await this.redis.hgetall(taskKey);

    // Инициализация прогресса задач, если его нет
    if (!userTasksData) {
      await this.initializeTasksForNewUser(userId);
    } else {
      // Проверка времени последнего обновления
      const lastUpdateDate = lastDailyUpdate ? new Date(lastDailyUpdate) : null;

      // Если обновление не происходило более 24 часов, сбрасываем прогресс ежедневных задач
      if (
        !lastUpdateDate ||
        currentDate.getTime() - lastUpdateDate.getTime() >= 24 * 60 * 60 * 1000
      ) {
        await this.resetDailyTasksProgress(userId);
        await this.redis.set(lastDailyUpdateKey, currentDate.toISOString()); // Обновляем дату последнего обновления
      }
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

    const tasksWithProgress = await Promise.all(
      tasks.map(async (task) => {
        const taskProgressData = await this.redis.hget(taskKey, task.id);
        let progress = 0;
        let completed = false;

        if (taskProgressData) {
          const parsedProgress = JSON.parse(taskProgressData);
          progress = parsedProgress.progress;
          completed = parsedProgress.completed;
        }

        return {
          ...task,
          progress,
          completed,
        };
      }),
    );

    return tasksWithProgress;
  }

  private async resetDailyTasksProgress(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const dailyTasks = await this.taskRepository.find({
      where: { type: 'daily' },
    });

    const taskKey = `user:${userId}:tasks`;
    const updatedTaskIds: string[] = [];

    for (const task of dailyTasks) {
      const taskData = {
        progress: 0,
        completed: false,
      };

      await this.redis.hset(taskKey, task.id, JSON.stringify(taskData));

      updatedTaskIds.push(task.id);
    }

    if (user.completedTaskIds && updatedTaskIds.length > 0) {
      user.completedTaskIds = user.completedTaskIds.filter(
        (taskId) => !updatedTaskIds.includes(taskId),
      );
    }

    await this.userRepository.save(user);
  }

  private async initializeDailyTasksForUser(userId: string) {
    const dailyTasks = await this.taskRepository.find({
      where: { type: 'daily' },
    });

    const taskKey = `user:${userId}:tasks`;

    for (const task of dailyTasks) {
      const taskData = {
        progress: 0,
        completed: false,
      };
      await this.redis.hset(taskKey, task.id, JSON.stringify(taskData));
    }
  }

  async updateAndCompleteTask(
    userId: string,
    taskId: string,
    increment: number,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const task = await this.taskRepository.findOne({ where: { id: taskId } });

    if (!user || !task) {
      throw new Error('User or task not found');
    }

    const taskKey = `user:${userId}:tasks`;

    // Получаем текущий прогресс задачи из Redis
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

    // Обновляем прогресс
    currentProgress += increment;

    // Проверяем, достигнут ли целевой прогресс задачи
    if (currentProgress >= task.targetValue) {
      isCompleted = true;
      currentProgress = task.targetValue;

      // Проверяем, завершена ли задача для пользователя
      if (!user.completedTaskIds.includes(taskId)) {
        user.completedTaskIds.push(taskId);
        user.balance = Number(user.balance) + Number(task.reward);
        this.redis.del(`user:${userId}`);
        await this.userRepository.save(user);
      }
    }

    // Если данные о типе задачи отсутствуют в Redis, получаем их из задачи
    if (!taskType) {
      taskType = task.type;
    }

    // Обновляем прогресс задачи в Redis
    await this.redis.hset(
      taskKey,
      taskId,
      JSON.stringify({
        progress: currentProgress,
        completed: isCompleted,
        type: taskType,
      }),
    );

    return {
      taskId: task.id,
      taskTitle: task.taskTitle,
      progress: currentProgress,
      completed: isCompleted,
      userBalance: user.balance,
    };
  }

  async getTaskProgress(userId: string, taskId: string) {
    const taskKey = `user:${userId}:tasks`;
    const taskData = await this.redis.hget(taskKey, taskId);

    if (!taskData) {
      return { progress: 0, completed: false };
    }

    const parsedTaskData = JSON.parse(taskData);
    return {
      progress: parsedTaskData.progress,
      completed: parsedTaskData.completed,
    };
  }

  async initializeTasksForNewUser(userId: string) {
    const activeTasks = await this.taskRepository.find();

    const taskKey = `user:${userId}:tasks`;

    for (const task of activeTasks) {
      const taskData = {
        progress: 0,
        completed: false,
        type: task.type,
      };
      await this.redis.hset(taskKey, task.id, JSON.stringify(taskData));
    }
  }

  async updateProgressForRun(userId: string, points: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const taskKey = `user:${userId}:tasks`;

    const taskData = await this.redis.hgetall(taskKey);
    const tasks = await this.taskRepository.find({
      where: {
        actionType: 'points',
      },
    });

    // Обновляем каждую задачу типа points
    const updatedTasks = [];
    for (const task of tasks) {
      const taskProgressData = taskData[task.id];
      if (taskProgressData) {
        const parsedTaskData = JSON.parse(taskProgressData);
        if (!parsedTaskData.completed) {
          const updatedTask = await this.updateAndCompleteTask(
            userId,
            task.id,
            points,
          );
          updatedTasks.push(updatedTask);
        }
      }
    }

    return updatedTasks;
  }

  async updateProgressForInvite(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const taskKey = `user:${userId}:tasks`;

    // Получаем все задачи пользователя
    const taskData = await this.redis.hgetall(taskKey);
    const tasks = await this.taskRepository.find({
      where: {
        actionType: 'invite',
      },
    });

    // Обновляем каждую задачу типа invite
    const updatedTasks = [];
    for (const task of tasks) {
      const taskProgressData = taskData[task.id];
      if (taskProgressData) {
        const parsedTaskData = JSON.parse(taskProgressData);
        if (!parsedTaskData.completed) {
          // Здесь вы можете определить, на сколько увеличить прогресс
          const increment = 1; // или другое значение, в зависимости от вашего сценария
          const updatedTask = await this.updateAndCompleteTask(
            userId,
            task.id,
            increment,
          );
          updatedTasks.push(updatedTask);
        }
      }
    }

    return updatedTasks;
  }
}
