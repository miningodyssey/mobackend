import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  @Get('get/:userid')
  async getAllTasks(@Param('userid', ParseIntPipe) userid: number) {
    return await this.tasksService.getAllTasks(userid);
  }

  @Patch('complete/:id')
  async completeTask(
    @Param('id', ParseIntPipe) taskId: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    await this.tasksService.completeTask(userId, taskId);
    return { message: 'Task completed successfully' };
  }
}
