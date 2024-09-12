import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BullmqService } from '../../bullmq/bullmq.service';
import { BullmqFactory } from '../../bullmq/bullmq.factory';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private BullMqGetUserService: BullmqService;
  private BullMqCreateUserService: BullmqService;
  private BullMqUpdateUserService: BullmqService;
  constructor(
    private readonly gameDataService: UsersService,
    private readonly bullmqFactory: BullmqFactory,
  ) {
    this.BullMqCreateUserService = this.bullmqFactory.create(
      'createUserOrGetExistingUser',
    );
    this.BullMqGetUserService = this.bullmqFactory.create('getUser');
    this.BullMqUpdateUserService = this.bullmqFactory.create('updateUser');
  }

  @Get(':id')
  getUser(@Param('id') userId: string) {
    return this.BullMqGetUserService.addJobWithResponse({ userId: userId });
  }

  // Создание пользователя, если он не существует
  @Post('create/:id')
  createUserIfNotExists(
    @Param('id') userId: string,
    @Body() userData: Partial<User>,
  ) {
    return this.BullMqCreateUserService.addJobWithResponse({
      userId: userId,
      userData: userData,
    });
  }

  // Обновление данных пользователя
  @Put('update/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: Partial<User>,
  ) {
    return this.BullMqUpdateUserService.addJob({
      userId: userId,
      updateData: updateData,
    });
  }
}
