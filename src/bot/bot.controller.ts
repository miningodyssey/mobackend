import { Injectable } from '@nestjs/common';
import { BotService } from './bot.service';

@Injectable()
export class BotController {
    constructor(private readonly telegrafbotService: BotService) {}

    startBot() {
        this.telegrafbotService.startBot();
    }
}
