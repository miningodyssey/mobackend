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
import {BullMQModule} from "./bullmq/bullmq.module";
import {UsersModule} from "./repositories/users/users.module";
import {TasksModule} from "./repositories/tasks/tasks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [User, Task],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,  // Для продакшена убедитесь, что сертификаты доверены
      },
    }),
    TypeOrmModule.forFeature([User, Task]),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: 'redis://default:BWjE2eFUFrNgxvqQPdlgUmJZS133aj6p@redis-16770.c135.eu-central-1-1.ec2.redns.redis-cloud.com:16770',
      }),
    }),
    AuthModule,
    UsersModule,
    TasksModule
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}
