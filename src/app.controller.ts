import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import * as process from "process";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log(
        process.env.REDIS_HOST,
        parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_PASSWORD)
    return this.appService.getHello();
  }
}
