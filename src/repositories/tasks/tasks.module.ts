import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entity/tasks.entity';
import { UsersModule } from "../users/users.module";
import { User } from "../users/entity/user.entity";
import * as process from "process";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]), // Импорт сущностей
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: "redis://default:BWjE2eFUFrNgxvqQPdlgUmJZS133aj6p@redis-16770.c135.eu-central-1-1.ec2.redns.redis-cloud.com:16770",
      }),
    }),

  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, TypeOrmModule], // Экспорт TasksService и TypeOrmModule
})
export class TasksModule {}
