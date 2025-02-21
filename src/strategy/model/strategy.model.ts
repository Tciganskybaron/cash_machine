import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StrategyDocument = HydratedDocument<Strategy>;

class SellOrder {
	@Prop({ required: true, index: true })
	price: string;

	@Prop({ required: true })
	amount: string;
}

@Schema({ timestamps: true, collection: 'strategy' })
export class Strategy {
	@Prop({ required: true, unique: true, index: true })
	ucid: string; // Уникальный ID монеты в CoinMarketCap

	@Prop({ required: true })
	totalTokens: string; // Сколько выделено токенов на торговлю

	@Prop({ required: true })
	maxSellPrice: string; // Максимальная цена продажи

	@Prop({ required: true })
	gridCount: number; // Количество сеток для торговли

	@Prop({ type: [SellOrder], required: true })
	sellOrders: SellOrder[];
}

export const StrategySchema = SchemaFactory.createForClass(Strategy);
