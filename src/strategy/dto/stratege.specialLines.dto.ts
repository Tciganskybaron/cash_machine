import { IsDefined, IsNumber, IsString, Matches } from 'class-validator';

export class StrategySpecialLinesDto {
	@IsDefined()
	@IsString()
	base_coin_ucid: string; // Id токена в CoinMarketCup, основной монеты

	@IsDefined()
	@IsString()
	quote_сoin_ucid: string; // Id токена в CoinMarketCup, в которой будет выражена цена

	@IsDefined()
	@IsNumber()
	chain_id: number; // ID блокчейна

	@IsDefined()
	@IsString()
	totalTokens: string; // Сколько выделено токенов на торговлю

	@IsDefined()
	@IsString()
	@Matches(/^[0-9]+(\.[0-9]+)?$/, {
		message: 'maxSellPrice must be a decimal number with a dot, e.g. 0.51',
	})
	maxSellPrice: string; // // Максимальная цена продажи

	@IsDefined()
	@IsString()
	@Matches(/^[0-9]+(\.[0-9]+)?$/, {
		message: 'currentPrice must be a decimal number with a dot, e.g. 0.51',
	})
	currentPrice: string; // Текущая цена

	@IsDefined()
	@IsNumber()
	specialLinesCount: number; // Количество особых линий, не меньше 2х

	@IsDefined()
	@IsNumber()
	ordinaryLinesCount: number; // Количество обычных линий, не меньше 2х

	@IsDefined()
	@IsString()
	@Matches(/^[0-9]+(\.[0-9]+)?$/, {
		message: 'specialPercent must be a decimal number with a dot, e.g. 0.51',
	})
	specialPercent: string; // Процент от токенов для специальных линий не менее 51%, записывается ка 0.51
}
