import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Strategy, StrategyDocument } from './model/strategy.model';
import { StrategyDto } from './dto/strategy.dto';
import { CoinService } from 'src/coin/coin.service';
import BigNumber from 'bignumber.js';
import { TradingCoinDto } from 'src/trading/dto/trading_coin.dto';
import { TradingOrderDto } from 'src/trading/dto/trading_order.dto copy';

@Injectable()
export class StrategyService {
	private readonly logger = new Logger(StrategyService.name);

	constructor(
		@InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
		private readonly coinService: CoinService,
	) {}

	async createStrategy(dto: StrategyDto): Promise<Strategy> {
		// Проверяем, существует ли токен в Coin через сервис
		const coin = await this.coinService.setCoinIsTading(dto.ucid);
		if (!coin) {
			throw new Error(`Token with ucid ${dto.ucid} does not exist in Coin database.`);
		}

		// Учитываем decimals
		const decimals = new BigNumber(10).pow(coin.decimals);

		// Преобразуем данные в BigNumber
		const totalTokens = new BigNumber(dto.totalTokens).times(decimals);
		const maxSellPrice = new BigNumber(dto.maxSellPrice);
		const currentPrice = new BigNumber(dto.currentPrice);
		const gridCount = new BigNumber(dto.gridCount);

		// Генерация сетки продаж
		const step = maxSellPrice.minus(currentPrice).div(gridCount);
		const tokensPerGrid = totalTokens.div(gridCount);

		const sellOrders = Array.from({ length: gridCount.toNumber() }, (_, i) => ({
			price: currentPrice.plus(step.times(i + 1)).toFixed(coin.decimals),
			amount: tokensPerGrid.toFixed(),
		}));

		const newStrategy = new this.strategyModel({
			ucid: dto.ucid,
			totalTokens: totalTokens.toFixed(),
			maxSellPrice: maxSellPrice.toFixed(),
			gridCount: gridCount.toNumber(),
			sellOrders,
		});

		await newStrategy.save();
		this.logger.log(`Strategy for ${dto.ucid} created`);
		return newStrategy;
	}

	async getActiveOrders(dto: TradingCoinDto[]): Promise<TradingOrderDto[] | null> {
		const result = [];
		for (const coinDto of dto) {
			const { price, ucid } = coinDto;
			// Агрегируем данные с фильтрацией и суммированием для каждой монеты
			const coinResult = await this.strategyModel.aggregate([
				{
					$match: { ucid }, // Ищем по UCID
				},
				{
					$unwind: '$sellOrders', // Разворачиваем массив sellOrders
				},
				{
					$match: {
						'sellOrders.price': { $lt: new BigNumber(price).toString() }, // Оставляем только те ордера, у которых цена меньше текущей
					},
				},
				{
					$group: {
						_id: '$ucid', // Группируем по UCID
						totalAmount: { $sum: { $toDecimal: '$sellOrders.amount' } }, // Суммируем amount
					},
				},
			]);
			// Если ордера найдены для этой монеты, добавляем их в результат
			if (coinResult.length > 0) {
				const totalAmount = new BigNumber(coinResult[0].totalAmount.toString()); // Преобразуем Decimal128 в BigNumber
				result.push({
					ucid: coinResult[0]._id,
					totalAmount: totalAmount.toFixed(), // Теперь используем toFixed() на BigNumber
				});
			}
		}

		if (!result.length) return null;

		return result;
	}
}
