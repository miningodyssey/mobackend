import { Inject, Injectable } from '@nestjs/common';
import { ConnectionOptions, Job, Queue, QueueEvents, Worker } from 'bullmq';
import * as process from 'process';
import { UsersService } from '../repositories/users/users.service';
@Injectable()
export class BullmqService {
  private queue: Queue;
  private queueEvents: QueueEvents;
  private connection: ConnectionOptions;

  constructor(
    private readonly queueName: string,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {
    this.connection = {
      host: 'redis-17717.c300.eu-central-1-1.ec2.redns.redis-cloud.com',
      port: parseInt(process.env.REDIS_PORT || '17717'),
      password: '8d3jNtUHcWBU2DoRjBdvZETCzyLl50Ex',
      username: 'default',
    };
    this.queue = new Queue(queueName, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    });
    this.createWorker(queueName);
    this.queueEvents = new QueueEvents(queueName, {
      connection: this.connection,
    });
  }

  async addJob(data: any): Promise<Job> {
    return await this.queue.add('myJob', data);
  }

  async addJobWithResponse(data: any): Promise<Job> {
    const job = await this.queue.add('myJob', data);
    return await job.waitUntilFinished(this.queueEvents);
  }

  private createWorker(queueName: string) {
    const worker = new Worker(
      queueName,
      async (job) => {
        try {
          if (queueName === 'createUserOrGetExistingUser') {
            await this.usersService.createUserIfNotExists(
              job.data.userId,
              job.data.userData,
            );
          }
          if (queueName === 'getUser') {
            await this.usersService.getUser(job.data.userId);
          }
          if (queueName === 'updateUser') {
            await this.usersService.updateUser(
              job.data.userId,
              job.data.updateData,
            );
          }
        } catch (e) {
          console.log('Error', e);
        }
      },
      { connection: this.connection },
    );

    worker.on('error', (error) => {
      console.log(`Error ${error.message}`);
    });

    worker.on('completed', (job) => {
      console.log(`Task ${job.id} completed`);
    });
  }
}
