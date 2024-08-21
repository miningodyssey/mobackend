import {Injectable} from '@nestjs/common';
import {Context, Telegraf} from 'telegraf';
import * as process from "process";

@Injectable()
export class BotService {
    private bot: Telegraf;

    constructor(
    ) {
    }


    initializeBot() {
        this.bot = new Telegraf(`${process.env.BOT_TOKEN}`);
        this.setupCommands();
    }

    private setupCommands() {
        this.bot.start(async (ctx) => {
            await ctx.replyWithPhoto('https://gateway.btfs.io/btfs/QmdGUdLfyLyFaYYq1t2c2KhkTeoPBrRZ1vFRhes7M31LMj','👇 Choose an item from the menu', {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [[{
                        text: 'Play Now!',
                        callback_data: '123'
                    }, {
                        text: 'FAQ',
                        callback_data: '123'
                    }, {
                        text: 'Check NFT',
                        callback_data: '123'
                    }]],
                },
            });
        });
    }

    startBot() {
        setTimeout(() =>
        {
            if (!this.bot) {
                this.initializeBot();
            }
            this.bot.launch()
        }, 30000)
    }
}
