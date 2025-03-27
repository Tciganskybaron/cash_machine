import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MSchema } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type CoinDocument = HydratedDocument<Coin>;

@Schema({ _id: false })
export class ChainAddress {
	@Prop({ type: Number, required: true })
	chain_id: number; // id блокчейна

	@Prop({ type: String, required: true })
	address: string; // адрес контракта токена
}

const ChainAddressSchema = SchemaFactory.createForClass(ChainAddress);

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

	@Prop({ type: [ChainAddressSchema], required: true })
	chain_addresses: ChainAddress[]; // cписок адресов токена в разных блокчейнах
}

export const CoinSchema = SchemaFactory.createForClass(Coin);
