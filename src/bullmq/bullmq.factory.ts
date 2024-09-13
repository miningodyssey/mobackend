import { Injectable, Inject } from '@nestjs/common';
import { BullmqService } from './bullmq.service';
import {UsersService} from "../repositories/users/users.service";

@Injectable()
export class BullmqFactory {
    constructor(
        @Inject(UsersService) private readonly usersService: UsersService
    ) {}

    create(queueName: string): BullmqService {
        return new BullmqService(queueName, this.usersService);
    }
}
