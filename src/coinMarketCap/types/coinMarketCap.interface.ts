import { ModuleMetadata } from '@nestjs/common';

export interface ICoinMarketCapOptions {
	apiKey: string;
	apiUrl: string;
}

export interface ICoinMarketCapModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: any[]) => Promise<ICoinMarketCapOptions> | ICoinMarketCapOptions;
	inject?: any[];
}
