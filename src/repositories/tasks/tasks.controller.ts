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
  async getAllTasks(@Param('userid') userid: string) {
    return await this.tasksService.getAllTasks(userid);
  }

  @Patch('progress/:taskId')
  async updateAndCompleteTask(
      @Param('taskId') taskId: string,
      @Body('userId') userId: string,
      @Body('increment') increment: number,
  ) {
    const result = await this.tasksService.updateAndCompleteTask(userId, taskId, increment);
    return { message: 'Task progress updated successfully', result };
  }

  @Get('progress/:userId/:taskId')
  async getTaskProgress(
      @Param('userId') userId: string,
      @Param('taskId') taskId: string,
  ) {
    const progress = await this.tasksService.getTaskProgress(userId, taskId);
    return { progress };
  }
}
