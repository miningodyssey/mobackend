import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UsersService } from './repositories/users/users.service';
import { UsersController } from './repositories/users/users.controller';
import { User } from './repositories/users/entity/user.entity';
import * as process from 'process';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Task } from './repositories/tasks/entity/tasks.entity';
import { TasksService } from './repositories/tasks/tasks.service';
import { TasksController } from './repositories/tasks/tasks.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [User, Task],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Task]),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: 'redis://default:BWjE2eFUFrNgxvqQPdlgUmJZS133aj6p@redis-16770.c135.eu-central-1-1.ec2.redns.redis-cloud.com:16770',
      }),
    }),
    AuthModule,
    BotModule,
  ],
  providers: [UsersService, TasksService, AppService],
  controllers: [UsersController, TasksController, AppController],
})
export class AppModule {}
