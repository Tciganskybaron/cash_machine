import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	ConflictException,
	BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Coin } from './model/coin.model';
import { CoinDto } from './dto/coin.dto';
import { CoinMarketCapService } from 'src/coinmarketcap/coinmarketcap.service';

@Injectable()
export class CoinService {
	constructor(
		@InjectModel(Coin.name) private coinModel: Model<Coin>,
		private readonly coinMarketCapService: CoinMarketCapService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async addCoin(coinDto: CoinDto): Promise<Coin> {
		try {
			if (!coinDto.ucid) {
				throw new BadRequestException('ucid is required');
			}

			const exists = await this.coinModel.findOne({ ucid: coinDto.ucid });
			if (exists) {
				throw new ConflictException(`Coin ${coinDto.symbol} already exists`);
			}

			const newCoin = new this.coinModel(coinDto);
			await newCoin.save();

			return newCoin;
		} catch (error) {
			if (error instanceof BadRequestException || error instanceof ConflictException) {
				throw error;
			}
			throw new InternalServerErrorException('Error creating coin');
		}
	}

	async getAllCoins(): Promise<Coin[]> {
		return this.coinModel.find();
	}

	async getCoinByUcid(ucid: string): Promise<Coin | null> {
		const coin = await this.coinModel.findOne({ ucid });
		if (!coin) {
			throw new NotFoundException(`Coin with ucid ${ucid} not found`);
		}
		return coin;
	}

	async getTradingCoins(): Promise<Coin[]> {
		return this.coinModel.find({ isTrading: true });
	}

	async setCoinIsTading(ucid: string): Promise<Coin | null> {
		const coin = await this.coinModel.findOneAndUpdate({ ucid }, { isTrading: true });
		if (!coin) {
			throw new NotFoundException(`Coin with ucid ${ucid} not found`);
		}
		return coin;
	}

	async deleteCoinByUcid(ucid: string): Promise<Coin | null> {
		const coin = await this.coinModel.findOneAndDelete({ ucid });
		if (!coin) {
			throw new NotFoundException(`Coin with ucid ${ucid} not found`);
		}
		return coin;
	}

	@Cron(CronExpression.EVERY_30_MINUTES)
	async getCoinPrices(): Promise<void> {
		try {
			const coins = await this.coinModel.find({ isTrading: true });
			const ucids = coins.map((coin) => coin.ucid);
			console.log('ucids', ucids);
			if (!ucids.length) {
				return;
			}

			const prices = await this.coinMarketCapService.fetchPricesByUCID(ucids);
			let pricesUp = false;
			for (const coin of coins) {
				const newPrice = prices[coin.ucid];
				const oldPrice = coin.price;
				if (newPrice > oldPrice) {
					await this.coinModel.findOneAndUpdate({ ucid: coin.ucid }, { price: newPrice });
					pricesUp = true;
				}
			}

			if (pricesUp) {
				this.eventEmitter.emit('coin.pricesUpdated');
			}
		} catch (error: unknown) {
			if (error instanceof HttpException) {
				// Если это HttpException, пробрасываем дальше
				throw error;
			}

			if (error instanceof Error) {
				// Если это обычный Error, выбрасываем InternalServerErrorException
				throw new InternalServerErrorException(`Error updating coin prices: ${error.message}`);
			}

			// приводим к строке и выбрасываем
			throw new InternalServerErrorException(`Error updating coin prices: ${String(error)}`);
		}
	}

	async updateCoinPrices(ucid: string, newPrice: number): Promise<void> {
		const coin = await this.coinModel.findOne({ ucid });
		if (!coin) {
			throw new NotFoundException(`Coin with ucid ${ucid} not found`);
		}
		await this.coinModel.updateOne({ _id: coin._id }, { price: newPrice });
	}
}
