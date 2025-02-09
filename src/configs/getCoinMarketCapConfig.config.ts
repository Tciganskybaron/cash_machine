import { ConfigService } from '@nestjs/config';
import { COINMARKETCAP_API_URL } from 'src/coinMarketCap/constants/coinMarketCap.constants';
import { ICoinMarketCapOptions } from 'src/coinMarketCap/types/coinMarketCap.interface';

export const getCoinMarketCapConfig = (configService: ConfigService): ICoinMarketCapOptions => {
	const apiKey = configService.get<string>('COINMARKETCAP_API_KEY');
	if (!apiKey) {
		throw new Error('COINMARKETCAP_API_KEY не задан');
	}

	return {
		apiKey,
		apiUrl: COINMARKETCAP_API_URL,
	};
};
