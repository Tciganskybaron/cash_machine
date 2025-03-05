import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { CoinModule } from 'src/coin/coin.module';
import { StrategyModule } from 'src/strategy/strategy.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './model/order.model';
import { OneInchModule } from 'src/1inch/1inch.module';

@Module({
	imports: [
		CoinModule,
		StrategyModule,
		OneInchModule,
		MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
	],
	providers: [OrderService],
	exports: [OrderService],
})
export class OrderModule {}
