import { Injectable } from '@nestjs/common';
import { CoinService } from 'src/coin/coin.service';
import { StrategyService } from 'src/strategy/strategy.service';
import { OrderCoinDto } from './dto/order_coin.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { OneInchService } from 'src/1inch/1inch.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from './model/order.model';
import { OrderDto } from './dto/order.dto copy';

@Injectable()
export class OrderService {
	private readonly USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
	private readonly MAX_RETRIES = 5;

	constructor(
		private readonly coinService: CoinService,
		private readonly strategyService: StrategyService,
		private readonly oneInchService: OneInchService,
		@InjectModel(Order.name) private readonly orderModel: Model<Order>,
	) {}

	@OnEvent('coin.pricesUpdated')
	async updateCoinPricesAndCheckOrders(): Promise<void> {
		const coins = await this.coinService.getTradingCoins();
		const orderCoins: OrderCoinDto[] = coins.map((coin) => ({
			ucid: coin.ucid,
			price: coin.price,
		}));

		const orders = await this.strategyService.getActiveOrders(orderCoins);
		if (orders?.length) {
			for (const orderData of orders) {
				await this.processOrder(orderData);
			}
		}
		return;
	}

	private async processOrder(orderData: OrderDto): Promise<void> {
		const newOrder = await this.orderModel.create({
			ucid: orderData.ucid,
			src: orderData.src,
			dst: this.USDC_ADDRESS,
			amount: orderData.total_amount,
			chain_id: orderData.chain_id,
			status: OrderStatus.PENDING,
			strategy_id: orderData.strategy_id,
			sell_order_ids: orderData.sell_order_ids,
		});

		let retries = 0;
		while (retries < this.MAX_RETRIES) {
			try {
				const result = await this.oneInchService.swapTokens(
					{
						src: newOrder.src as `0x${string}`,
						dst: newOrder.dst as `0x${string}`,
						amount: newOrder.amount,
						slippage: 0.5,
					},
					newOrder.chain_id,
				);

				if (result.status === 'success') {
					await this.orderModel.updateOne(
						{ _id: newOrder._id },
						{ status: OrderStatus.COMPLETED, tx_hash: result.txHash },
					);
					console.log(`✅ Order ${newOrder._id} completed`);
					return;
				}

				console.log(`⚠️ Swap failed (attempt ${retries + 1}): ${result.status}`);
			} catch (error) {
				console.error(`🚨 Error on swap attempt ${retries + 1}:`, error);
			}

			retries++;
			await new Promise((res) => setTimeout(res, 3000)); // Ждем перед повтором
		}

		console.error(`❌ Order ${newOrder._id} failed after ${this.MAX_RETRIES} attempts`);
	}
}
