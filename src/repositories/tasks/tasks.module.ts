import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entity/tasks.entity';
import {UsersModule} from "../users/users.module";
import {User} from "../users/entity/user.entity";
import * as process from "process";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]), // Import entity
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_CONNECTION,
      }),
    }),
   UsersModule
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
