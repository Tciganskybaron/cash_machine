import { IsDefined, IsNumber, IsString } from 'class-validator';

export class StrategyDto {
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
	totalTokens: string; // Сколько выделено токенов на торговлю. Указывать в целых токенак к примеру 40.0005 Degen без перевода в wei.

	@IsDefined()
	@IsString()
	maxSellPrice: string; // Максимальная цена продажи

	@IsDefined()
	@IsString()
	minSellPrice: string; // Минимальная цена для продажи

	@IsDefined()
	@IsString()
	gridCount: string; // Количество сеток
}
