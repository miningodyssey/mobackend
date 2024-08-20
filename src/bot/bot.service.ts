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
            await ctx.reply('👇 Choose an item from the menu', {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [[{
                        text: 'Play Now!'
                    }, {
                        text: 'FAQ'
                    },
                    {
                        text: 'Check NFT'
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
