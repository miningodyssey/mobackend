import { Injectable, Inject } from '@nestjs/common';
import { BullmqService } from './bullmq.service';
import { TrackingService } from '../repositories/tracking/tracking.service';

@Injectable()
export class BullmqFactory {
    constructor(
        @Inject(TrackingService) private readonly trackingService: TrackingService
    ) {}

    create(queueName: string): BullmqService {
        return new BullmqService(queueName, this.trackingService);
    }
}
