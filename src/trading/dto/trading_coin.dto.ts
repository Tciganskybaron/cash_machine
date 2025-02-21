import { IsDefined, IsString } from 'class-validator';

export class TradingCoinDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	price: number;
}
