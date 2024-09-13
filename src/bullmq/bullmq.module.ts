import { Module } from '@nestjs/common';
import {BullmqService} from "./bullmq.service";
import {BullmqFactory} from "./bullmq.factory";
import {UsersService} from "../repositories/users/users.service";
import {UsersModule} from "../repositories/users/users.module";

@Module({
    imports: [UsersService, UsersModule],
    providers: [BullmqService, BullmqFactory, UsersService],
    exports: [BullmqService, BullmqFactory],
})
export class BullMQModule {}
