import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MSchema } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type CoinDocument = HydratedDocument<Coin>;

@Schema({ timestamps: true, collection: 'coin' })
export class Coin {
	_id?: MSchema.Types.ObjectId;

	@Prop({ required: true, unique: true, index: true })
	ucid: string; // Уникальный ID монеты в CoinMarketCap

	@Prop({ required: true })
	symbol: string; // Символ (BTC, ETH, SOL)

	@Prop({ required: true })
	name: string; // Название (Bitcoin, Ethereum)

	@Prop({ required: true })
	decimals: number; // количество нулей после запятой

	@Prop({ required: true, index: true })
	isTrading: boolean; // Включена торговля

	@Prop()
	price: number; // Последняя цена

	@Prop()
	lastUpdated: Date; // Дата последнего обновления
}

export const CoinSchema = SchemaFactory.createForClass(Coin);
