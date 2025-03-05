import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema } from 'mongoose';
import { Coin } from 'src/coin/model/coin.model';

export type StrategyDocument = HydratedDocument<Strategy>;

export enum SellOrderStatus {
	PENDING = 'pending', // Ожидает
	EXECUTING = 'executing', // Выполняется
	COMPLETED = 'completed', // Выполнено
}

@Schema({ _id: true })
export class SellOrder {
	_id?: MSchema.Types.ObjectId;

	@Prop({ required: true, index: true })
	price: string; // Цена

	@Prop({ required: true })
	amount: string; // Количество токенов для продажи

	@Prop({ required: true, enum: SellOrderStatus, default: SellOrderStatus.PENDING })
	status: SellOrderStatus; // Статус ордера
}

const SellOrderSchema = SchemaFactory.createForClass(SellOrder);

@Schema({ _id: true, timestamps: true, collection: 'strategy' })
export class Strategy {
	_id?: MSchema.Types.ObjectId;

	@Prop({ type: MSchema.Types.ObjectId, ref: 'Coin', required: true, unique: true, index: true })
	coin: Coin; // Монета для торговли

	@Prop({ required: true })
	chain_id: number; // ID Блокчейна

	@Prop({ required: true })
	total_tokens: string; // Сколько выделено токенов на торговлю

	@Prop({ required: true })
	max_sell_price: string; // Максимальная цена продажи

	@Prop({ required: true })
	grid_count: number; // Количество сеток для торговли

	@Prop({ type: [SellOrderSchema], required: true })
	sell_orders: SellOrder[]; // Массив ордеров для продажи
}

export const StrategySchema = SchemaFactory.createForClass(Strategy);
