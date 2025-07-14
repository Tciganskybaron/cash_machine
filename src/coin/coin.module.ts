import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinController } from './coin.controller';
import { CoinService } from './coin.service';
import { Coin, CoinSchema } from './model/coin.model';
import { ScheduleModule } from '@nestjs/schedule';
import { CoinMarketCapModule } from 'src/coinmarketcap/coinmarketcap.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Coin.name, schema: CoinSchema }]),
		ScheduleModule.forRoot(), // Подключаем Cron
		CoinMarketCapModule, // Подключаем API CoinMarketCap
	],
	controllers: [CoinController],
	providers: [CoinService],
	exports: [CoinService],
})
export class CoinModule {}
