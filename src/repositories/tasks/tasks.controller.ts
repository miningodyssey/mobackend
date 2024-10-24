import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/CreateTask.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.createTask(createTaskDto);
    return { message: 'Task created successfully', task };
  }

  @Get('get/:userid')
  async getAllTasks(@Param('userid', ParseIntPipe) userid: string) {
    return await this.tasksService.getAllTasks(userid);
  }

  @Patch('complete/:id')
  async completeTask(
      @Param('id', ParseIntPipe) taskId: string,
      @Body('userId', ParseIntPipe) userId: string,
  ) {
    await this.tasksService.completeTask(userId, taskId);
    return { message: 'Task completed successfully' };
  }

  @Patch('progress/:taskId')
  async updateTaskProgress(
      @Param('taskId', ParseIntPipe) taskId: string,
      @Body('userId', ParseIntPipe) userId: string,
      @Body('increment', ParseIntPipe) increment: number,
  ) {
    await this.tasksService.updateTaskProgress(userId, taskId, increment);
    return { message: 'Task progress updated successfully' };
  }

  @Get('progress/:userId/:taskId')
  async getTaskProgress(
      @Param('userId', ParseIntPipe) userId: string,
      @Param('taskId', ParseIntPipe) taskId: string,
  ) {
    const progress = await this.tasksService.getTaskProgress(userId, taskId);
    return { progress };
  }
}
