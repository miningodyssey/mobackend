import { Injectable, Inject } from '@nestjs/common';
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
      username: 'default',
      host: "redis-16770.c135.eu-central-1-1.ec2.redns.redis-cloud.com",
      port: parseInt('16770'),
      password: "BWjE2eFUFrNgxvqQPdlgUmJZS133aj6p",
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
          switch (queueName) {
            case 'getUserData':
              return await this.usersService.getUser(job.data.userId);
            case 'updateUserData':
              return await this.usersService.updateUser(
                job.data.userId,
                job.data.updateData,
              );
            case 'createUserData':
              return await this.usersService.createUserIfNotExists(
                job.data.userId,
                job.data.userData,
              );
            case 'getTop':
              return await this.usersService.getTop(job.data.userId);
            case 'getFriendsTop':
              return await this.usersService.getFriendsTop(job.data.userId);
            case 'getReferalsTop':
              return await this.usersService.getReferalsTop(job.data.userId);
            case 'updateTop':
              return await this.usersService.finishRunAndUpdateTop(
                job.data.userId,
                job.data.coinsEarned,
                job.data.record,
              );
            case 'addEnergy':
              return await this.usersService.manuallyAddEnergy(
                job.data.userId,
                job.data.amount,
              );
            case 'updateSetting':
              return await this.usersService.updateUserSettings(
                job.data.userId,
                job.data.newSettings,
              );
            case 'updateCharacterSelection':
              return await this.usersService.saveUserSelections(
                job.data.userId,
                {
                  selectedSkin: job.data.selectedSkin,
                  selectedWagon: job.data.selectedWagon,
                  selectedRoad: job.data.selectedRoad,
                  selectedSlideObstacle: job.data.selectedSlideObstacle,
                  selectedJumpObstacle: job.data.selectedJumpObstacle,
                },
              );
            default:
              throw new Error('Unknown job type');
          }
        } catch (e) {
          console.log('Error', e);
          throw e;
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
