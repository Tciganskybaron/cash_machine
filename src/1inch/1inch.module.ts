import { OneInchService } from './1inch.service';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { I1InchModuleAsyncOptions } from './types/1inch.interface';
import { ONEINCH_MODULE_OPTIONS } from './constants/1inch.constants';
import { OneInchController } from './1inch.controller';

@Global()
@Module({
	controllers: [OneInchController],
})
export class OneInchModule {
	static forRootAsync(options: I1InchModuleAsyncOptions): DynamicModule {
		const asyncOptions = this.createAsyncOptionsProvider(options);
		return {
			module: OneInchModule,
			imports: options.imports,
			providers: [OneInchService, asyncOptions],
			exports: [OneInchService],
		};
	}

	private static createAsyncOptionsProvider(options: I1InchModuleAsyncOptions): Provider {
		return {
			provide: ONEINCH_MODULE_OPTIONS,
			useFactory: async (...args: any[]) => {
				const config = await options.useFactory(...args);
				return config;
			},
			inject: options.inject || [],
		};
	}
}
