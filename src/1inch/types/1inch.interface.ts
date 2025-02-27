import { ModuleMetadata } from '@nestjs/common';

export interface I1InchOptions {
	apiKey1inch: string;
	api1InchBaseUrl: string;
	privateKey: string;
}

export interface I1InchModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: any[]) => Promise<I1InchOptions> | I1InchOptions;
	inject?: any[];
}
