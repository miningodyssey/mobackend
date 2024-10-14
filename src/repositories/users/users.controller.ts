import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    UseGuards,
} from '@nestjs/common';
import {UsersService} from './users.service';
import {User} from './entity/user.entity';
import {JwtAuthGuard} from '../../auth/jwt-auth.guard';
import {BullmqFactory} from "../../bullmq/bullmq.factory";
import {BullmqService} from "../../bullmq/bullmq.service";

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {

    private BullMqCreateUserService: BullmqService;
    private BullMqUpdateUserService: BullmqService;
    private BullMqGetUserService: BullmqService;
    private BullMqGetTopService: BullmqService;
    private BullMqGetReferalsTopService: BullmqService;
    private BullMqGetUpdateTopService: BullmqService;


    constructor(private readonly gameDataService: UsersService, private readonly bullmqFactory: BullmqFactory) {
        this.BullMqCreateUserService = this.bullmqFactory.create('createUserData');
        this.BullMqUpdateUserService = this.bullmqFactory.create('updateUserData');
        this.BullMqGetUserService = this.bullmqFactory.create('getUserData');
        this.BullMqGetTopService = this.bullmqFactory.create('getTop');
        this.BullMqGetReferalsTopService = this.bullmqFactory.create('getReferalsTop');
        this.BullMqGetUpdateTopService = this.bullmqFactory.create('updateTop');


    }

    @Get(':id')
    getUser(@Param('id') userId: string) {
        return this.BullMqGetUserService.addJobWithResponse({userId: userId})
    }


    @Post('create/:id')
    createUserIfNotExists(
        @Param('id') userId: string,
        @Body() userData: Partial<User>,
    ) {
        return this.BullMqCreateUserService.addJobWithResponse({userId: userId, userData: userData});
    }

    @Put('update/:id')
    async updateUser(
        @Param('id') userId: string,
        @Body() updateData: Partial<User>,
    ) {
        return this.BullMqUpdateUserService.addJob({userId: userId, updateData: updateData});
    }

    @Get('top/:id')
    async getTopPlayers(@Param('id') userId: string) {
        return await this.BullMqGetTopService.addJobWithResponse({userId: userId});
    }

    @Get(':id/referals')
    async getAllReferals(@Param('id') userId: string) {
        return await this.BullMqGetReferalsTopService.addJobWithResponse({userId: userId});
    }

    @Post('updatetop/:id')
    async updateTopAfterRun(
        @Param('id') userId: string,
        @Body('coins') coinsEarned: number,
    ) {
        await this.BullMqGetUpdateTopService.addJob({userId: userId, coinsEarned: coinsEarned});
    }

}
