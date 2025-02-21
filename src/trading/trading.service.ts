import { Injectable } from '@nestjs/common';
import { CoinService } from 'src/coin/coin.service';
import { StrategyService } from 'src/strategy/strategy.service';
import { TradingCoinDto } from './dto/trading_coin.dto';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class TradingService {
	constructor(
		private readonly coinService: CoinService,
		private readonly strategyService: StrategyService,
	) {}

	@OnEvent('coin.pricesUpdated')
	async updateCoinPricesAndCheckOrders(): Promise<void> {
		const coins = await this.coinService.getTradingCoins();
		const orderCoins: TradingCoinDto[] = coins.map((coin) => ({
			ucid: coin.ucid,
			price: coin.price,
		}));

		const orders = await this.strategyService.getActiveOrders(orderCoins);
		if (orders?.length) {
			console.log('Active orders found:', orders);
			// В будущем здесь можно будет вызвать UniswapService.
		}
	}
}
