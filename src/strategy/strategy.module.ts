import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Strategy, StrategySchema } from './model/strategy.model';
import { StrategyController } from './strategy.controller';
import { Coin, CoinSchema } from 'src/coin/model/coin.model';
import { CoinModule } from 'src/coin/coin.module';
import { CoinService } from 'src/coin/coin.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Strategy.name, schema: StrategySchema },
			{ name: Coin.name, schema: CoinSchema },
		]),
		CoinModule,
	],
	providers: [StrategyService, CoinService],
	controllers: [StrategyController],
	exports: [StrategyService],
})
export class StrategyModule {}
