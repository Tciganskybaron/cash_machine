import { ModuleMetadata } from '@nestjs/common';
import { Chain, PublicClient, WalletClient } from 'viem';
import { mainnet, base, arbitrum } from 'viem/chains';

export enum ChainId {
	ETHEREUM = 1,
	BASE = 8453,
	ARBITRUM = 42161,
}

export interface ChainClients {
	publicClient: PublicClient;
	walletClient: WalletClient;
}

export interface ViemOptions {
	privateKey: `0x${string}`;
}

export const CHAIN_CONFIG: Record<ChainId, Chain> = {
	[ChainId.ETHEREUM]: mainnet,
	[ChainId.BASE]: base,
	[ChainId.ARBITRUM]: arbitrum,
};

// Создаем массив поддерживаемых сетей
export const SUPPORTED_CHAINS = [ChainId.ETHEREUM, ChainId.BASE, ChainId.ARBITRUM] as const;

export interface ViemModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: any[]) => Promise<ViemOptions> | ViemOptions;
	inject?: any[];
}
