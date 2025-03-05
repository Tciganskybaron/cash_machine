import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SellOrderStatus, Strategy, StrategyDocument } from './model/strategy.model';
import { StrategyDto } from './dto/strategy.dto';
import { CoinService } from 'src/coin/coin.service';
import BigNumber from 'bignumber.js';
import { OrderCoinDto } from 'src/order/dto/order_coin.dto';
import { OrderDto } from 'src/order/dto/order.dto copy';

@Injectable()
export class StrategyService {
	private readonly logger = new Logger(StrategyService.name);

	constructor(
		@InjectModel(Strategy.name) private strategyModel: Model<StrategyDocument>,
		private readonly coinService: CoinService,
	) {}

	async getStrategyById(strategyId: string): Promise<StrategyDocument | null> {
		return this.strategyModel.findById(strategyId).populate('coin').exec();
	}

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
			coin: coin._id,
			chain_id: dto.chain_id,
			total_tokens: totalTokens.toFixed(),
			max_sell_price: maxSellPrice.toFixed(),
			grid_count: gridCount.toNumber(),
			sell_orders: sellOrders,
		});

		await newStrategy.save();
		this.logger.log(`Strategy for ${dto.ucid} created`);
		return newStrategy;
	}

	// async getActiveOrders(dto: OrderCoinDto[]): Promise<OrderDto[] | null> {
	// 	const result = [];
	// 	// Проходим по каждому монету из dto
	// 	for (const coinDto of dto) {
	// 		const { price, ucid } = coinDto;
	// 		// Выполняем агрегацию для подсчета и получения нужных данных
	// 		const coinResult = await this.strategyModel.aggregate([
	// 			{
	// 				$match: { ucid }, // Ищем по UCID
	// 			},
	// 			{
	// 				$unwind: '$sell_orders', // Разворачиваем массив sell_orders
	// 			},
	// 			{
	// 				$match: {
	// 					'sell_orders.price': { $lt: new BigNumber(price).toString() }, // Оставляем только ордера с ценой меньше текущей
	// 					'sell_orders.status': SellOrderStatus.PENDING, // Фильтруем по статусу
	// 				},
	// 			},
	// 			{
	// 				$group: {
	// 					_id: '$ucid', // Группируем по UCID
	// 					strategy_id: { $first: '$_id' }, // Получаем strategy_id
	// 					chain_id: { $first: '$chain_id' }, // Добавляем chain_id
	// 					total_amount: { $sum: { $toDecimal: '$sell_orders.amount' } }, // Суммируем amount
	// 					sell_order_ids: { $push: '$sell_orders' }, // Сохраняем все ордера для дальнейшего обновления
	// 				},
	// 			},
	// 		]);

	// 		// Если результат есть, добавляем в итоговый массив
	// 		if (coinResult.length > 0) {
	// 			const ucid = coinResult[0]._id;
	// 			const totalAmount = new BigNumber(coinResult[0].total_amount.toString()); // Преобразуем Decimal128 в BigNumber
	// 			const chain_id = coinResult[0].chain_id;

	// 			const coin = await this.coinService.getCoinByUcid(ucid);

	// 			const src = coin?.chain_addresses.find((el) => el.chain_id === chain_id)?.address || '';

	// 			result.push({
	// 				ucid,
	// 				chain_id,
	// 				src: src || '',
	// 				total_amount: totalAmount.toFixed(), // Сумма ордеров
	// 				strategy_id: coinResult[0].strategy_id, // strategy_id стратегии
	// 				sell_order_ids: coinResult[0].sell_order_ids.map((order: SellOrder) => order._id), // Массив sell_order_id ордеров
	// 			});

	// 			// Этап 2: Обновление статуса ордеров на EXECUTING
	// 			const sellOrderIds = coinResult[0].sell_order_ids.map((order: SellOrder) => order._id); // Получаем все sell_order_id

	// 			await this.strategyModel.updateMany(
	// 				{ ucid, 'sell_orders._id': { $in: sellOrderIds } }, // Находим стратегии с нужным UCID и ордерами
	// 				{
	// 					$set: { 'sell_orders.$[order].status': SellOrderStatus.EXECUTING }, // Обновляем статус на EXECUTING
	// 				},
	// 				{
	// 					arrayFilters: [{ 'order._id': { $in: sellOrderIds } }], // Применяем только к ордерам с нужными sell_order_id
	// 				},
	// 			);
	// 		}
	// 	}

	// 	if (!result.length) return null;

	// 	return result;
	// }
	async getActiveOrders(dto: OrderCoinDto[]): Promise<OrderDto[] | null> {
		const result = [];
		for (const coinDto of dto) {
			const { price, ucid } = coinDto;
			// Собираем pipeline, где:
			// - через $lookup присоединяем информацию о монете (coinInfo)
			// - отфильтровываем ордера по цене и статусу
			// - группируем данные, а затем добавляем поле src, извлекая его из coinInfo.chain_addresses
			const pipeline = [
				// Находим стратегии, для которых монета имеет нужный ucid
				{
					$lookup: {
						from: 'coin', // имя коллекции монет
						localField: 'coin', // ссылка на монету в стратегии (ObjectId)
						foreignField: '_id',
						as: 'coinInfo',
					},
				},
				{ $unwind: '$coinInfo' },
				// Фильтруем стратегии по coinInfo.ucid, если нужно
				{ $match: { 'coinInfo.ucid': ucid } },
				{ $unwind: '$sell_orders' },
				{
					$match: {
						'sell_orders.price': { $lt: new BigNumber(price).toString() },
						'sell_orders.status': SellOrderStatus.PENDING,
					},
				},
				{
					$group: {
						_id: '$coinInfo.ucid',
						strategy_id: { $first: '$_id' },
						chain_id: { $first: '$chain_id' },
						total_amount: { $sum: { $toDecimal: '$sell_orders.amount' } },
						sell_order_ids: { $push: '$sell_orders._id' },
						coinInfo: { $first: '$coinInfo' },
					},
				},
				// Добавляем поле src: ищем в coinInfo.chain_addresses адрес, где chain_id совпадает
				{
					$addFields: {
						src: {
							$arrayElemAt: [
								{
									$filter: {
										input: '$coinInfo.chain_addresses',
										as: 'addr',
										cond: { $eq: ['$$addr.chain_id', '$chain_id'] },
									},
								},
								0,
							],
						},
					},
				},
				// Проецируем результат: возвращаем нужные поля
				{
					$project: {
						_id: 0,
						ucid: '$_id',
						strategy_id: 1,
						chain_id: 1,
						total_amount: 1,
						sell_order_ids: 1,
						src: '$src.address',
					},
				},
			];

			const coinResult = await this.strategyModel.aggregate(pipeline);

			if (coinResult.length > 0) {
				result.push(coinResult[0]);

				// Этап 2: Обновление статуса ордеров на EXECUTING
				const sellOrderIds = coinResult[0].sell_order_ids;
				await this.strategyModel.updateMany(
					{ 'sell_orders._id': { $in: sellOrderIds } },
					{ $set: { 'sell_orders.$[order].status': SellOrderStatus.EXECUTING } },
					{ arrayFilters: [{ 'order._id': { $in: sellOrderIds } }] },
				);
			}
		}

		return result.length ? result : null;
	}
}
