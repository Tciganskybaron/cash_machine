import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema } from 'mongoose';
import { Strategy } from 'src/strategy/model/strategy.model';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
	PENDING = 'pending', // Ожидает
	EXECUTING = 'executing', // Выполняется
	COMPLETED = 'completed', // Выполнено
	FAILED = 'failed', // Не выполнено
}

@Schema({ timestamps: true, collection: 'order' })
export class Order {
	@Prop({ index: true })
	ucid: string; // Уникальный ID монеты в CoinMarketCap

	@Prop({ required: true })
	src: string; // Адрес токена для продажи

	@Prop({ required: true })
	dst: string; // Адрес токена для покупки

	@Prop({ required: true })
	amount: string; // Количество токенов для обмена

	@Prop({ required: true })
	chain_id: number; // ID Блокчейна

	@Prop()
	tx_hash: string; // Хеш транзакции

	@Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
	status: OrderStatus; // Статус ордера

	@Prop({ type: MSchema.Types.ObjectId, ref: Strategy.name, required: true, index: true })
	strategy_id: MSchema.Types.ObjectId; // Id Стратегии, которая создала ордер

	@Prop({ type: [MSchema.Types.ObjectId], required: true })
	sell_order_ids: MSchema.Types.ObjectId[]; // Список ID ордеров внутри стратегии
}

export const OrderSchema = SchemaFactory.createForClass(Order);
