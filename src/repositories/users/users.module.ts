import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { UsersController } from './users.controller';
import { BullmqFactory } from "../../bullmq/bullmq.factory";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Import entity
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: 'redis://default:BWjE2eFUFrNgxvqQPdlgUmJZS133aj6p@redis-16770.c135.eu-central-1-1.ec2.redns.redis-cloud.com:16770',
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, BullmqFactory],
  exports: [UsersService],
})
export class UsersModule {}
