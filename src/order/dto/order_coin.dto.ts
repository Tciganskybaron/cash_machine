import { IsDefined, IsString } from 'class-validator';

export class OrderCoinDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	price: number;
}
