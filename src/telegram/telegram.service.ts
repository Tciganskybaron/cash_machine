import { Inject, Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ITelegramOptions } from './types/telegram.interface';
import { TELEGRAMM_MODULE_OPTIONS } from './constants/telegram.constants';

@Injectable()
export class TelegramService {
	bot: Telegraf;
	options: ITelegramOptions;

	constructor(@Inject(TELEGRAMM_MODULE_OPTIONS) options: ITelegramOptions) {
		this.bot = new Telegraf(options.token);
		this.options = options;
	}

	async sendMessage(message: string, chaiId: string = this.options.chatID) {
		try {
			await this.bot.telegram.sendMessage(chaiId, message);
		} catch (error) {
			console.log('error', error);
		}
	}
}
