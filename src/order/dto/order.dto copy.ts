import { IsDefined, IsNumber, IsString } from 'class-validator';
import { Schema as MSchema } from 'mongoose';

export class OrderDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	src: string;

	@IsDefined()
	@IsString()
	dst: string;

	@IsDefined()
	@IsString()
	amount: string;

	@IsDefined()
	@IsString()
	sell_order_ids: MSchema.Types.ObjectId[];

	@IsDefined()
	@IsString()
	strategy_id: MSchema.Types.ObjectId;

	@IsDefined()
	@IsNumber()
	chain_id: number;
}
