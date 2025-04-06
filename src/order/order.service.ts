import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CoinService } from 'src/coin/coin.service';
import { StrategyService } from 'src/strategy/strategy.service';
import { OrderCoinDto } from './dto/order_coin.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { OneInchService } from 'src/1inch/1inch.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from './model/order.model';
import { OrderDto } from './dto/order.dto copy';
import { ViemService } from 'src/viem/viem.service';
import { IApproveTokenParams } from 'src/1inch/types/1inch.params';
import { TelegramService } from 'src/telegram/telegram.service';
import BigNumber from 'bignumber.js';
import { validateAndParseChainId } from './utils/chain.utils';

@Injectable()
export class OrderService {
	private readonly MAX_RETRIES = 5;

	constructor(
		private readonly coinService: CoinService,
		private readonly strategyService: StrategyService,
		private readonly oneInchService: OneInchService,
		private readonly viemService: ViemService,
		private readonly telegramService: TelegramService,
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
			dst: orderData.dst,
			amount: orderData.amount,
			chain_id: orderData.chain_id,
			status: OrderStatus.PENDING,
			strategy_id: orderData.strategy_id,
			sell_order_ids: orderData.sell_order_ids,
		});

		let retries = 0;
		while (retries < this.MAX_RETRIES) {
			try {
				// 1) Approve
				await this.approveToken(
					{ amount: newOrder.amount, tokenAddress: newOrder.src as `0x${string}` },
					newOrder.chain_id,
				);

				// 2) Получаем swapData (данные для транзакции)
				const swapData = await this.oneInchService.swapTokens(
					{
						src: newOrder.src as `0x${string}`,
						dst: newOrder.dst as `0x${string}`,
						amount: newOrder.amount,
						slippage: 0.5,
					},
					newOrder.chain_id,
					this.viemService.account.address,
				);

				// 3) Отправляем транзакцию
				const swap = await this.viemService.sendTransaction({
					to: swapData.tx.to,
					data: swapData.tx.data,
					value: swapData.tx.value,
					chainId: newOrder.chain_id,
				});

				// 4) Если транзакция прошла успешно
				if (swap.status === 'success') {
					// Отмечаем ордер выполненным
					await this.orderModel.updateOne(
						{ _id: newOrder._id },
						{ status: OrderStatus.COMPLETED, tx_hash: swap.txHash },
					);

					// --- ВАЖНО ---
					// Весь "пост-транзакционный" код оборачиваем в отдельный try/catch,
					// чтобы при ошибке здесь НЕ перезапускать свап заново
					try {
						const soldAmount = new BigNumber(newOrder.amount)
							.shiftedBy(-swapData.srcToken.decimals)
							.toFixed();

						const boughtAmount = new BigNumber(swapData.dstAmount)
							.shiftedBy(-swapData.dstToken.decimals)
							.toFixed();

						await this.telegramService.sendMessageSwap({
							chainId: orderData.chain_id,
							txHash: swap.txHash,
							soldAmount,
							soldSymbol: swapData.srcToken.symbol,
							boughtAmount,
							boughtSymbol: swapData.dstToken.symbol,
						});
					} catch (postError) {
						// Логируем ошибку, но НЕ повторяем транзакцию
						console.error('Error in post-transaction logic:', postError);
					}

					// После пост-логики всё равно выходим из метода, не делаем повтор
					return;
				}
			} catch (error: unknown) {
				throw new InternalServerErrorException(
					`🚨 Error on swap attempt ${retries + 1}: ${String(error)}`,
				);
			}

			retries++;
			await new Promise((res) => setTimeout(res, 5000));
		}

		// Если все попытки исчерпаны, выбрасываем исключение
		throw new InternalServerErrorException(
			`❌ Order ${newOrder._id} failed after ${this.MAX_RETRIES} attempts`,
		);
	}

	private async approveToken(params: IApproveTokenParams, chainId: string | number): Promise<void> {
		const approveData = await this.oneInchService.approveToken(
			{ amount: params.amount, tokenAddress: params.tokenAddress as `0x${string}` },
			chainId,
		);

		const validChainId = validateAndParseChainId(chainId);

		await this.viemService.sendTransaction({
			to: approveData.to,
			data: approveData.data,
			value: approveData.value,
			chainId: validChainId,
		});
	}
}
