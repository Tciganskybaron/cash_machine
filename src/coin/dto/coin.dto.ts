import { IsBoolean, IsDefined, IsNumber, IsString } from 'class-validator';

export class CoinDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	symbol: string;

	@IsDefined()
	@IsString()
	name: string;

	@IsDefined()
	@IsNumber()
	decimals: number;

	@IsDefined()
	@IsBoolean()
	isTrading: boolean;
}
