import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { UsersController } from './users.controller';
import { BullmqFactory } from "../../bullmq/bullmq.factory";
import * as process from 'process';
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Импорт сущности User
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: "redis://default:BWjE2eFUFrNgxvqQPdlgUmJZS133aj6p@redis-16770.c135.eu-central-1-1.ec2.redns.redis-cloud.com:16770",
      }),
    }),
    TasksModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, BullmqFactory],
  exports: [UsersService],
})
export class UsersModule {}
