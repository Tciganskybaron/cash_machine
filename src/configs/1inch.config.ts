import { ConfigService } from '@nestjs/config';
import { I1InchOptions } from 'src/1inch/types/1inch.interface';

export const get1InchConfig = (configService: ConfigService): I1InchOptions => {
	const privateKey = configService.get('PRIVAT_KEY');
	const apiKey1inch = configService.get('API_KEY_1INCH');
	const api1InchBaseUrl = configService.get('API_1INCH_BASE_URL');
	if (!privateKey) {
		throw new Error('PRIVAT_KEY не задан');
	}

	if (!apiKey1inch) {
		throw new Error('API_KEY_1INCH не задан');
	}

	if (!api1InchBaseUrl) {
		throw new Error('API_1INCH_BASE_URL не задан');
	}

	return {
		privateKey,
		apiKey1inch,
		api1InchBaseUrl,
	};
};
