import { IsDefined, IsString } from 'class-validator';

export class TradingOrderDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	totalAmount: string;
}
