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
import {BullmqFactory} from "../../bullmq/bullmq.factory";
import {BullmqService} from "../../bullmq/bullmq.service";

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {

  private BullMqCreateUserService: BullmqService;
  private BullMqUpdateUserService: BullmqService;
  private BullMqGetUserService: BullmqService;

  constructor(private readonly gameDataService: UsersService,  private readonly bullmqFactory: BullmqFactory) {
      this.BullMqCreateUserService = this.bullmqFactory.create('createUserData');
      this.BullMqUpdateUserService = this.bullmqFactory.create('updateUserData');
      this.BullMqGetUserService = this.bullmqFactory.create('getUserData');
  }

  @Get(':id')
  getUser(@Param('id') userId: string) {
    return this.BullMqGetUserService.addJobWithResponse({ userId: userId})
  }
  @Post('create/:id')
  createUserIfNotExists(
    @Param('id') userId: string,
    @Body() userData: Partial<User>,
  ) {
    return this.BullMqCreateUserService.addJobWithResponse({userId: userId, userData: userData});
  }

  // Обновление данных пользователя
  @Put('update/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: Partial<User>,
  ) {
    return this.BullMqUpdateUserService.addJob({userId: userId, updateData: updateData});
  }
}
