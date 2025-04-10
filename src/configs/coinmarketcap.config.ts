import { ConfigService } from '@nestjs/config';
import { ICoinMarketCapOptions } from 'src/coinmarketcap/types/coinmarketcap.interface';

export const getCoinMarketCapConfig = (configService: ConfigService): ICoinMarketCapOptions => {
	const apiKey = configService.get<string>('COINMARKETCAP_API_KEY');
	if (!apiKey) {
		throw new Error('COINMARKETCAP_API_KEY is not defined in environment variables');
	}

	return {
		apiKey,
		apiUrl: 'https://pro-api.coinmarketcap.com/v2',
	};
};
