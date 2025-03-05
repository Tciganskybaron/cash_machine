import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfig } from 'src/configs/mongo.config';
import { TelegramModule } from './telegram/telegram.module';
import { getTelegramConfig } from './configs/telegram.config';
import { CoinMarketCapModule } from './coinMarketCap/coinMarketCap.module';
import { getCoinMarketCapConfig } from './configs/getCoinMarketCapConfig.config';
import { CoinModule } from './coin/coin.module';
import { StrategyModule } from './strategy/strategy.module';
import { OrderModule } from './order/order.module';
import { OneInchModule } from './1inch/1inch.module';
import { get1InchConfig } from './configs/1inch.config';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: getMongoConfig,
		}),
		AuthModule,
		ConfigModule.forRoot({ isGlobal: true }),
		TelegramModule.forRootAsync({
			inject: [ConfigService],
			useFactory: getTelegramConfig,
		}),
		CoinMarketCapModule.forRootAsync({
			inject: [ConfigService],
			useFactory: getCoinMarketCapConfig,
		}),
		OneInchModule.forRootAsync({
			inject: [ConfigService],
			useFactory: get1InchConfig,
		}),
		EventEmitterModule.forRoot(),
		CoinModule,
		StrategyModule,
		OrderModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
