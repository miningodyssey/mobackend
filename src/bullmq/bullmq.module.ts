import { Module } from '@nestjs/common';
import { BullmqService } from './bullmq.service';
import { BullmqFactory } from './bullmq.factory';
import { UsersModule } from '../repositories/users/users.module';
import { UsersService } from '../repositories/users/users.service';

@Module({
  imports: [UsersService, UsersModule],
  providers: [BullmqService, UsersService, BullmqFactory],
  exports: [BullmqService, BullmqFactory],
})
export class BullMQModule {}
