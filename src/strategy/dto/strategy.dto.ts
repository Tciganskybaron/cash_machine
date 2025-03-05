import { IsDefined, IsNumber, IsString } from 'class-validator';

export class StrategyDto {
	@IsDefined()
	@IsString()
	ucid: string; // Id токена в CoinMarketCup

	@IsDefined()
	@IsNumber()
	chain_id: number; // ID блокчейна

	@IsDefined()
	@IsString()
	totalTokens: string; // Сколько выделено токенов на торговлю

	@IsDefined()
	@IsString()
	maxSellPrice: string; // // Максимальная цена продажи

	@IsDefined()
	@IsString()
	currentPrice: string; // Текущая цена

	@IsDefined()
	@IsString()
	gridCount: string; // Количество сеток
}
