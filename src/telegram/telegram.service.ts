import { HttpException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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

	// Обычная отправка сообщения (без форматирования)
	async sendMessage(message: string, chatId: string = this.options.chatID) {
		try {
			await this.bot.telegram.sendMessage(chatId, message);
		} catch (error: unknown) {
			// Если уже HttpException — пробрасываем дальше
			if (error instanceof HttpException) {
				throw error;
			}
			// Иначе выбрасываем InternalServerErrorException
			throw new InternalServerErrorException(`Failed to send Telegram message: ${String(error)}`);
		}
	}

	// Новый метод для отправки сведений о свапе
	async sendMessageSwap(params: {
		chainId: number;
		txHash: string;
		soldAmount: string;
		soldSymbol: string;
		boughtAmount: string;
		boughtSymbol: string;
	}) {
		// Сопоставление chainId -> ссылка на обозреватель
		const explorers: Record<number, string> = {
			1: 'https://etherscan.io/tx/',
			56: 'https://bscscan.com/tx/',
			42161: 'https://arbiscan.io/tx/',
			8453: 'https://basescan.org/tx/',
		};

		// Если нет в словаре - используем Etherscan по умолчанию
		const explorerUrl = explorers[params.chainId] ?? 'https://etherscan.io/tx/';

		// Формируем сообщение в формате HTML
		const message = `
🟢 <b>Прошел SWAP!</b> 
━━━━━━━━━━━━━━━━━━━━
<b>Обменяли:</b> ${params.soldAmount} <b>${params.soldSymbol}</b>
<b>Получили:</b> ${params.boughtAmount} <b>${params.boughtSymbol}</b>
━━━━━━━━━━━━━━━━━━━━
<b>Хеш:</b> <a href="${explorerUrl}${params.txHash}">${params.txHash}</a>
`;

		try {
			await this.bot.telegram.sendMessage(this.options.chatID, message, {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Показать транзакцию',
								url: `${explorerUrl}${params.txHash}`,
							},
						],
					],
				},
			});
		} catch (error: unknown) {
			// Если уже HttpException — пробрасываем дальше
			if (error instanceof HttpException) {
				throw error;
			}
			// Иначе выбрасываем InternalServerErrorException
			throw new InternalServerErrorException(
				`Failed to send Telegram swap message: ${String(error)}`,
			);
		}
	}
}
