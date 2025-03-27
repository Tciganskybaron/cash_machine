import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ViemService } from './viem.service';
import { VIEM_MODULE_OPTIONS } from './constants/viem.constants';
import { ViemModuleAsyncOptions } from './types/viem.interface';

@Global()
@Module({})
export class ViemModule {
	static forRootAsync(options: ViemModuleAsyncOptions): DynamicModule {
		const asyncOptions = this.createAsyncOptionsProvider(options);

		return {
			module: ViemModule,
			imports: options.imports,
			providers: [asyncOptions, ViemService],
			exports: [ViemService],
		};
	}

	private static createAsyncOptionsProvider(options: ViemModuleAsyncOptions): Provider {
		return {
			provide: VIEM_MODULE_OPTIONS,
			useFactory: async (...args: any[]) => {
				const config = await options.useFactory(...args);
				return config;
			},
			inject: options.inject || [],
		};
	}
}
