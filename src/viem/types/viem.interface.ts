import { ModuleMetadata } from '@nestjs/common';

export interface ViemOptions {
	privateKey: `0x${string}`;
}

export interface ViemModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: any[]) => Promise<ViemOptions> | ViemOptions;
	inject?: any[];
}
