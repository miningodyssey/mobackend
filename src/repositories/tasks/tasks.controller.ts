import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/CreateTask.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.createTask(createTaskDto);
    return { message: 'Task created successfully', task };
  }

  @Get()
  async getAllTasks() {
    const tasks = await this.tasksService.getAllTasks();
    return tasks;
  }

  @Patch(':id/complete')
  async completeTask(
    @Param('id', ParseIntPipe) taskId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    await this.tasksService.completeTask(userId, taskId);
    return { message: 'Task completed successfully' };
  }
}
