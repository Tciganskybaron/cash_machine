import { IsDefined, IsString } from 'class-validator';

export class StrategyDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	totalTokens: string;

	@IsDefined()
	@IsString()
	maxSellPrice: string;

	@IsDefined()
	@IsString()
	currentPrice: string;

	@IsDefined()
	@IsString()
	gridCount: string;
}
