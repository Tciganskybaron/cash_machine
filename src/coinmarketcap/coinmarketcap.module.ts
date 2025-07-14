import { DynamicModule, Global, Module, Provider } from '@nestjs/common';

import { COINMARKETCAP_MODULE_OPTIONS } from './constants/coinmarketcap.constants';
import { HttpModule } from '@nestjs/axios';
import { ICoinMarketCapModuleAsyncOptions } from './types/coinmarketcap.interface';
import { CoinMarketCapService } from './coinMarketCap.service';

@Global()
@Module({})
export class CoinMarketCapModule {
	static forRootAsync(options: ICoinMarketCapModuleAsyncOptions): DynamicModule {
		const asyncOptions = this.createAsyncOptionsProvider(options);
		return {
			module: CoinMarketCapModule,
			imports: [HttpModule, ...(options.imports || [])], // Добавляем HttpModule
			providers: [CoinMarketCapService, asyncOptions],
			exports: [CoinMarketCapService],
		};
	}

	private static createAsyncOptionsProvider(options: ICoinMarketCapModuleAsyncOptions): Provider {
		return {
			provide: COINMARKETCAP_MODULE_OPTIONS,
			useFactory: async (...args: any[]) => {
				const config = await options.useFactory(...args);
				return config;
			},
			inject: options.inject || [],
		};
	}
}
