import { Module } from '@nestjs/common';
import { TradingService } from './trading.service';
import { CoinModule } from 'src/coin/coin.module';
import { StrategyModule } from 'src/strategy/strategy.module';

@Module({
	imports: [CoinModule, StrategyModule],
	providers: [TradingService],
	exports: [TradingService],
})
export class TradingModule {}
