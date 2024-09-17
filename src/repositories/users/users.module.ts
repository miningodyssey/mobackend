import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { UsersController } from './users.controller';
import {BullmqFactory} from "../../bullmq/bullmq.factory";
import * as process from 'process'
@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import entity
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_CONNECTION,
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, BullmqFactory],
  exports: [UsersService],
})
export class UsersModule {}
