import { Controller, Get, Param, Post, Body, Put } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('stats')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  // Получение данных пользователя по его ID
  @Get(':id')
  getUser(@Param('id') userId: string): Promise<User> {
    return this.gameDataService.getUser(Number(userId));
  }

  // Создание пользователя, если он не существует
  @Post('create/:id')
  createUserIfNotExists(
    @Param('id') userId: string,
    @Body() userData: Partial<User>,
  ): Promise<User> {
    return this.gameDataService.createUserIfNotExists(Number(userId), userData);
  }

  // Обновление данных пользователя
  @Put('update/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: Partial<User>,
  ): Promise<void> {
    return this.gameDataService.updateUser(Number(userId), updateData);
  }
}
