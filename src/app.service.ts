import { Injectable } from '@nestjs/common';
import process from "process";

@Injectable()
export class AppService {
  getHello(): string {
    return process.env.DATABASE_NAME;
  }
}
