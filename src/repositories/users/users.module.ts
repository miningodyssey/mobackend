import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { UsersController } from './users.controller';
import {BullmqFactory} from "../../bullmq/bullmq.factory";
import {BullMQModule} from "../../bullmq/bullmq.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import entity
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: 'redis://:3!?sKWic58?kS+@c-c9qfdb9nluf7qu6p03uj.rw.mdb.yandexcloud.net:6379',
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, BullmqFactory],
  exports: [UsersService],
})
export class UsersModule {}
