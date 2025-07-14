import { ModuleMetadata } from '@nestjs/common';

export interface ICoinMarketCapOptions {
	apiKey: string;
	apiUrl: string;
}

export interface ICoinMarketCapUrls {
	website?: string[];
	technical_doc?: string[];
	twitter?: string[];
	reddit?: string[];
	message_board?: string[];
	announcement?: string[];
	chat?: string[];
	explorer?: string[];
	source_code?: string[];
}

export interface ICoinMarketCapChainAddress {
	chain_id: number;
	address: string;
}

export interface ICoinMarketCapPlatform {
	id?: number;
	name?: string;
	symbol?: string;
	slug?: string;
	token_address?: string;
	decimals?: number;
}

export interface ICoinMarketCapMetadata {
	id: number;
	name: string;
	symbol: string;
	slug: string;
	description?: string;
	date_added?: string;
	date_launched?: string;
	tags?: string[];
	platform?: ICoinMarketCapPlatform;
	category: 'coin' | 'token';
	urls?: ICoinMarketCapUrls;
	logo?: string;
	notice?: string;
	self_reported_circulating_supply?: number;
	self_reported_market_cap?: number;
	self_reported_tags?: string[];
	infinite_supply?: boolean;
	decimals?: number;
	chain_addresses?: ICoinMarketCapChainAddress[];
}

export interface ICoinMarketCapMetadataResponse {
	data: Record<string, ICoinMarketCapMetadata>;
	status: {
		timestamp: string;
		error_code: number;
		error_message: string;
		elapsed: number;
		credit_count: number;
		notice: string;
	};
}

export interface ICoinMarketCapModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: any[]) => Promise<ICoinMarketCapOptions> | ICoinMarketCapOptions;
	inject?: any[];
}
