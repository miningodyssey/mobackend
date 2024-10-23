import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BullmqFactory } from '../../bullmq/bullmq.factory';
import { BullmqService } from '../../bullmq/bullmq.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private BullMqCreateUserService: BullmqService;
  private BullMqUpdateUserService: BullmqService;
  private BullMqGetUserService: BullmqService;
  private BullMqGetTopService: BullmqService;
  private BullMqGetReferalsTopService: BullmqService;
  private BullMqGetUpdateTopService: BullmqService;
  private BullMqGetUpdateEnergyService: BullmqService;
  private BullMqGetFriendsTopService: BullmqService;
  private BullMqUpdateSettingsService: BullmqService;
  private BullMqUpdateSelectionService: BullmqService;

  constructor(
    private readonly gameDataService: UsersService,
    private readonly bullmqFactory: BullmqFactory,
  ) {
    this.BullMqCreateUserService = this.bullmqFactory.create('createUserData');
    this.BullMqUpdateUserService = this.bullmqFactory.create('updateUserData');
    this.BullMqGetUserService = this.bullmqFactory.create('getUserData');
    this.BullMqGetTopService = this.bullmqFactory.create('getTop');
    this.BullMqGetReferalsTopService =
      this.bullmqFactory.create('getReferalsTop');
    this.BullMqGetFriendsTopService =
      this.bullmqFactory.create('getFriendsTop');
    this.BullMqGetUpdateTopService = this.bullmqFactory.create('updateTop');
    this.BullMqGetUpdateEnergyService = this.bullmqFactory.create('addEnergy');
    this.BullMqUpdateSettingsService =
      this.bullmqFactory.create('updateSetting');
    this.BullMqUpdateSelectionService = this.bullmqFactory.create(
      'updateCharacterSelection',
    );
  }

  @Get(':id')
  getUser(@Param('id') userId: string) {
    return this.BullMqGetUserService.addJobWithResponse({ userId: userId });
  }

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

  @Put('update/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: Partial<User>,
  ) {
    try {
      return await this.BullMqUpdateUserService.addJobWithResponse({
        userId: userId,
        updateData: updateData,
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update user');
    }
  }

  @Get('top/:id')
  async getTopPlayers(@Param('id') userId: string) {
    return await this.BullMqGetTopService.addJobWithResponse({
      userId: userId,
    });
  }

  @Get(':id/friends')
  async getAllFriends(@Param('id') userId: string) {
    return await this.BullMqGetFriendsTopService.addJobWithResponse({
      userId: userId,
    });
  }

  @Get(':id/referals')
  async getAllReferals(@Param('id') userId: string) {
    return await this.BullMqGetReferalsTopService.addJobWithResponse({
      userId: userId,
    });
  }

  @Post('updatetop/:id')
  async updateTopAfterRun(
    @Param('id') userId: string,
    @Body('coins') coinsEarned: number,
  ) {
    await this.BullMqGetUpdateTopService.addJob({
      userId: userId,
      coinsEarned: coinsEarned,
    });
  }

  @Post(':userId/add-energy')
  async addEnergy(
    @Param('userId') userId: string,
    @Body('amount') amount: number,
  ) {
    return await this.BullMqGetUpdateEnergyService.addJobWithResponse({
      userId: userId,
      amount: amount,
    });
  }

  @Put(':id/settings')
  async updateUserSettings(
    @Param('id') userId: string,
    @Body() newSettings: Record<string, string>,
  ) {
    try {
      return await this.BullMqUpdateSettingsService.addJobWithResponse({
        userId: userId,
        newSettings: newSettings,
      });
    } catch (error) {
      throw new BadRequestException('Ошибка при обновлении настроек');
    }
  }

  @Put(':id/selection')
  async updateUserSelection(
    @Param('id') userId: string,
    @Body() newSelection: Record<string, string>,
  ) {
    try {
      return await this.BullMqUpdateSelectionService.addJobWithResponse({
        userId: userId,
        selectedUpgrade: newSelection.selectedUpgrade,
        selectedSkin: newSelection.selectedSkin,
      });
    } catch (error) {
      throw new BadRequestException('Ошибка при обновлении настроек');
    }
  }
}
