import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { SellOrder, SellOrderStatus, Strategy, StrategyDocument } from './model/strategy.model';
import { StrategyDto } from './dto/strategy.dto';
import { CoinService } from 'src/coin/coin.service';
import BigNumber from 'bignumber.js';
import { OrderCoinDto } from 'src/order/dto/order_coin.dto';
import { OrderDto } from 'src/order/dto/order.dto copy';
import { StrategySpecialLinesDto } from './dto/stratege.specialLines.dto';

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
		try {
			// 1) Проверяем базовую монету
			const base_coin = await this.coinService.setCoinIsTading(dto.base_coin_ucid);
			if (!base_coin) {
				throw new NotFoundException(
					`Token with ucid ${dto.base_coin_ucid} does not exist in Coin database.`,
				);
			}

			// Проверяем, что у base_coin есть адрес для chain_id
			const baseCoinAddress = base_coin.chain_addresses.find(
				(addr) => addr.chain_id === dto.chain_id,
			);
			if (!baseCoinAddress) {
				throw new BadRequestException(
					`Base coin with ucid "${dto.base_coin_ucid}" does not have an address on chain ${dto.chain_id}`,
				);
			}

			// 2) Проверяем котируемую монету
			const quote_coin = await this.coinService.getCoinByUcid(dto.quote_сoin_ucid);
			if (!quote_coin) {
				throw new NotFoundException(
					`Token with ucid ${dto.quote_сoin_ucid} does not exist in Coin database.`,
				);
			}

			// Проверяем, что у quote_coin есть адрес для chain_id
			const quoteCoinAddress = quote_coin.chain_addresses.find(
				(addr) => addr.chain_id === dto.chain_id,
			);
			if (!quoteCoinAddress) {
				throw new BadRequestException(
					`Quote coin with ucid "${dto.quote_сoin_ucid}" does not have an address on chain ${dto.chain_id}`,
				);
			}

			// 3) Подготавливаем BigNumber для расчётов
			const decimals = new BigNumber(10).pow(base_coin.decimals);
			const totalTokens = new BigNumber(dto.totalTokens).times(decimals);
			const maxSellPrice = new BigNumber(dto.maxSellPrice);
			const currentPrice = new BigNumber(dto.currentPrice);
			const gridCount = new BigNumber(dto.gridCount);

			// 4) Генерация сетки продаж
			const step = maxSellPrice.minus(currentPrice).div(gridCount);
			const tokensPerGrid = totalTokens.div(gridCount);

			const sellOrders = Array.from({ length: gridCount.toNumber() }, (_, i) => ({
				price: currentPrice.plus(step.times(i + 1)).toFixed(base_coin.decimals),
				amount: tokensPerGrid.toFixed(),
			}));

			// 5) Создаём документ стратегии
			const newStrategy = new this.strategyModel({
				base_coin: base_coin._id,
				quote_сoin: quote_coin._id,
				chain_id: dto.chain_id,
				total_tokens: totalTokens.toFixed(),
				max_sell_price: maxSellPrice.toFixed(),
				grid_count: gridCount.toNumber(),
				sell_orders: sellOrders,
			});

			await newStrategy.save();
			this.logger.log(`Strategy for ${base_coin.symbol} created`);
			return newStrategy;
		} catch (error: unknown) {
			// Если это уже HttpException (NotFoundException и т.д.), пробрасываем дальше
			if (error instanceof HttpException) {
				throw error;
			}

			// Иначе оборачиваем в InternalServerErrorException
			throw new InternalServerErrorException(`Failed to create strategy: ${String(error)}`);
		}
	}

	async createStrategySpecialLines(dto: StrategySpecialLinesDto): Promise<Strategy> {
		try {
			// 1) Проверяем базовую монету
			const base_coin = await this.coinService.setCoinIsTading(dto.base_coin_ucid);
			if (!base_coin) {
				throw new NotFoundException(
					`Token with ucid ${dto.base_coin_ucid} does not exist in Coin database.`,
				);
			}

			// Проверяем, что у base_coin есть адрес для chain_id
			const baseCoinAddress = base_coin.chain_addresses.find(
				(addr) => addr.chain_id === dto.chain_id,
			);
			if (!baseCoinAddress) {
				throw new BadRequestException(
					`Base coin with ucid "${dto.base_coin_ucid}" does not have an address on chain ${dto.chain_id}`,
				);
			}

			// 2) Проверяем котируемую монету
			const quote_coin = await this.coinService.setCoinIsTading(dto.quote_сoin_ucid);
			if (!quote_coin) {
				throw new NotFoundException(
					`Token with ucid ${dto.quote_сoin_ucid} does not exist in Coin database.`,
				);
			}

			// Проверяем, что у quote_coin есть адрес для chain_id
			const quoteCoinAddress = quote_coin.chain_addresses.find(
				(addr) => addr.chain_id === dto.chain_id,
			);
			if (!quoteCoinAddress) {
				throw new BadRequestException(
					`Quote coin with ucid "${dto.quote_сoin_ucid}" does not have an address on chain ${dto.chain_id}`,
				);
			}

			// Допустим, в dto есть поля:
			//   dto.specialLinesCount (M),
			//   dto.ordinaryLinesCount (N),
			//   dto.specialPercent (доля для особых линий, число от 0 до 1),
			//   dto.totalTokens, dto.decimals (или base_coin.decimals),
			//   dto.currentPrice (минимальная цена),
			//   dto.maxSellPrice (максимальная цена).
			const M = new BigNumber(dto.specialLinesCount);
			const N = new BigNumber(dto.ordinaryLinesCount);
			const p = new BigNumber(dto.specialPercent); // >= 0.51 по условию

			if (M.lt(2)) {
				throw new BadRequestException(`specialLinesCount (M) must be >= 2`);
			}
			if (N.lt(2)) {
				throw new BadRequestException(`ordinaryLinesCount (N) must be >= 2`);
			}
			if (p.lt(0.51)) {
				throw new BadRequestException(`specialPercent must be >= 0.51`);
			}

			// 3) Общее кол-во линий
			// totalLines = M + (M-1)*N
			const totalLines = M.plus(M.minus(1).times(N));
			if (totalLines.lte(0)) {
				throw new BadRequestException(`Invalid total lines count`);
			}

			// 4) Считаем токены
			// const decimals = new BigNumber(10).pow(base_coin.decimals);
			const totalTokens = new BigNumber(dto.totalTokens); // только в токенах

			// Делим токены: p% для особых, (1-p)% для обычных
			const specialTotal = totalTokens.multipliedBy(p);
			const ordinaryTotal = totalTokens.minus(specialTotal);

			// 5) Расчёт цен (от currentPrice до maxSellPrice)
			const minPrice = new BigNumber(dto.currentPrice);
			const maxPrice = new BigNumber(dto.maxSellPrice);
			if (maxPrice.lte(minPrice)) {
				throw new BadRequestException(`maxSellPrice must be greater than currentPrice`);
			}

			const priceStep = maxPrice.minus(minPrice).div(totalLines.minus(1));

			const M_int = M.toNumber();
			const N_int = N.toNumber();
			const totalLinesInt = totalLines.toNumber();
			const totalOrdinaryLines = (M_int - 1) * N_int;

			const w_s = specialTotal.div(M);
			const w_o = ordinaryTotal.div(totalOrdinaryLines);

			const lineTypes: ('S' | 'O')[] = [];
			for (let i = 1; i <= M_int; i++) {
				lineTypes.push('S');
				if (i < M_int) {
					for (let j = 0; j < N_int; j++) {
						lineTypes.push('O');
					}
				}
			}

			const sellOrders: SellOrder[] = [];
			for (let i = 0; i < totalLinesInt; i++) {
				const lineType = lineTypes[i];
				const price = minPrice.plus(priceStep.multipliedBy(i));
				let amount: BigNumber;

				if (lineType === 'S') {
					amount = w_s;
				} else {
					amount = w_o;
				}

				sellOrders.push({
					price: price.toFixed(base_coin.decimals),
					amount: amount.toFixed(base_coin.decimals), // только в токенах
					status: SellOrderStatus.PENDING,
				});
			}

			const newStrategy = new this.strategyModel({
				base_coin: base_coin._id,
				quote_сoin: quote_coin._id,
				chain_id: dto.chain_id,
				total_tokens: totalTokens.toFixed(base_coin.decimals), // только в токенах
				max_sell_price: maxPrice.toFixed(),
				grid_count: totalLinesInt,
				sell_orders: sellOrders,
			});

			await newStrategy.save();
			this.logger.log(
				`Strategy with special lines for ${base_coin.symbol} created. totalLines=${totalLinesInt}`,
			);

			return newStrategy;
		} catch (error: unknown) {
			this.logger.error('Error creating strategy with special lines', error);

			// Если это уже HttpException (например, NotFoundException), пробрасываем
			if (error instanceof HttpException) {
				throw error;
			}
			// Иначе - InternalServerError
			throw new InternalServerErrorException(
				`Failed to create strategy with special lines: ${String(error)}`,
			);
		}
	}

	async getActiveOrders(dto: OrderCoinDto[]): Promise<OrderDto[] | null> {
		try {
			const result = [];

			for (const coinDto of dto) {
				const { price, ucid } = coinDto;
				console.log('price', price);
				const pipeline = [
					// 1) lookup для base_coin
					{
						$lookup: {
							from: 'coin', // имя коллекции монет
							localField: 'base_coin', // поле в модели Strategy
							foreignField: '_id',
							as: 'baseCoinInfo',
						},
					},
					{ $unwind: '$baseCoinInfo' },

					// 2) lookup для quote_coin
					{
						$lookup: {
							from: 'coin',
							localField: 'quote_сoin', // <-- обратите внимание, что в модели у вас "quote_сoin" с буквой 'с' (кириллица?)
							foreignField: '_id',
							as: 'quoteCoinInfo',
						},
					},
					{ $unwind: '$quoteCoinInfo' },

					// 3) Фильтруем стратегии, у которых baseCoinInfo.ucid совпадает с coinDto.ucid
					{
						$match: { 'baseCoinInfo.ucid': ucid },
					},

					// 4) Разворачиваем sell_orders и фильтруем по цене/статусу
					{ $unwind: '$sell_orders' },
					{
						$match: {
							'sell_orders.price': { $lt: new BigNumber(price).toString() },
							'sell_orders.status': { $in: [SellOrderStatus.PENDING, SellOrderStatus.EXECUTING] },
						},
					},

					// 5) Группируем
					{
						$group: {
							_id: '$baseCoinInfo.ucid',
							strategy_id: { $first: '$_id' },
							chain_id: { $first: '$chain_id' },
							amount: { $sum: { $toDecimal: '$sell_orders.amount' } },
							sell_order_ids: { $push: '$sell_orders._id' },
							baseCoinInfo: { $first: '$baseCoinInfo' },
							quoteCoinInfo: { $first: '$quoteCoinInfo' },
						},
					},

					// 6) Добавляем поля src и dst, выбирая из chain_addresses
					{
						$addFields: {
							src: {
								$arrayElemAt: [
									{
										$filter: {
											input: '$baseCoinInfo.chain_addresses',
											as: 'addr',
											cond: { $eq: ['$$addr.chain_id', '$chain_id'] },
										},
									},
									0,
								],
							},
							dst: {
								$arrayElemAt: [
									{
										$filter: {
											input: '$quoteCoinInfo.chain_addresses',
											as: 'addr',
											cond: { $eq: ['$$addr.chain_id', '$chain_id'] },
										},
									},
									0,
								],
							},
						},
					},

					// 7) Проецируем нужные поля под OrderDto
					{
						$project: {
							_id: 0,
							ucid: '$_id',
							strategy_id: 1,
							chain_id: 1,
							amount: 1,
							sell_order_ids: 1,
							src: '$src.address', // Адрес монеты, которую продаём
							dst: '$dst.address', // Адрес монеты, которую покупаем
						},
					},
				];

				const coinResult = await this.strategyModel.aggregate(pipeline);
				console.log('coinResult', coinResult);
				if (coinResult.length > 0) {
					// Добавляем в итоговый массив
					result.push(coinResult[0]);

					// Обновляем статус ордеров на EXECUTING
					const sellOrderIds = coinResult[0].sell_order_ids;
					await this.strategyModel.updateMany(
						{ 'sell_orders._id': { $in: sellOrderIds } },
						{ $set: { 'sell_orders.$[order].status': SellOrderStatus.EXECUTING } },
						{ arrayFilters: [{ 'order._id': { $in: sellOrderIds } }] },
					);
				}
			}

			return result.length ? result : null;
		} catch (error: unknown) {
			// Если это уже HttpException (например, выброшенная в других местах), пробрасываем дальше
			if (error instanceof HttpException) {
				throw error;
			}

			// Иначе оборачиваем в InternalServerErrorException
			throw new InternalServerErrorException(`Failed to get active orders: ${String(error)}`);
		}
	}

	async successOrder(sellOrderIds: ObjectId[]): Promise<void> {
		await this.strategyModel.updateOne(
			{ 'sell_orders._id': { $in: sellOrderIds } },
			{ $set: { 'sell_orders.$[order].status': SellOrderStatus.COMPLETED } },
			{ arrayFilters: [{ 'order._id': { $in: sellOrderIds } }] },
		);
	}
}
