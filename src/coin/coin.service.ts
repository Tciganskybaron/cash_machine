import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CoinMarketCapService } from 'src/coinMarketCap/coinMarketCap.service';
import { Coin } from './model/coin.model';
import { CoinDto } from './dto/coin.dto';

@Injectable()
export class CoinService {
	private readonly logger = new Logger(CoinService.name);

	constructor(
		@InjectModel(Coin.name) private coinModel: Model<Coin>,
		private readonly coinMarketCapService: CoinMarketCapService,
	) {}

	async addCoin(coinDto: CoinDto): Promise<Coin> {
		const exists = await this.coinModel.findOne({ ucid: coinDto.ucid });
		if (exists) {
			throw new Error(`Coin ${coinDto.symbol} already exists`);
		}

		const newCoin = new this.coinModel(coinDto);
		await newCoin.save();
		this.logger.log(`Coin ${coinDto.symbol} added`);
		return newCoin;
	}

	async getAllCoins(): Promise<Coin[]> {
		return this.coinModel.find();
	}

	async getCoinByUcid(ucid: string): Promise<Coin | null> {
		return this.coinModel.findOne({ ucid });
	}

	@Cron(CronExpression.EVERY_30_SECONDS)
	async updateCoinPrices(): Promise<void> {
		this.logger.log('Updating coin prices...');

		const coins = await this.coinModel.find({ isTrading: true });
		const ucids = coins.map((coin) => coin.ucid);
		if (!ucids.length) {
			this.logger.log('No coins found in database with isTrading = true.');
			return;
		}

		const prices = await this.coinMarketCapService.fetchPricesByUCID(ucids);

		for (const coin of coins) {
			const newPrice = prices[coin.ucid];

			if (newPrice !== null && newPrice !== undefined) {
				await this.coinModel.updateOne(
					{ _id: coin._id },
					{ price: newPrice, lastUpdated: new Date() },
				);
				this.logger.log(`Updated ${coin.symbol}: $${newPrice}`);
			} else {
				this.logger.warn(`Price for ${coin.symbol} is missing, skipping update.`);
			}
		}
	}
}
