import { Controller, Post, Body } from '@nestjs/common';
import { BullmqService } from "./bullmq.service";

@Controller('jobs')
export class BullmqController {
    constructor(private readonly myService: BullmqService) {}

    @Post()
    async addJob(@Body() data: any) {
        await this.myService.addJob(data);
        return { message: 'Job added' };
    }
}