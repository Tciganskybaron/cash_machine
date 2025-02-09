import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { COINMARKETCAP_MODULE_OPTIONS } from './constants/coinMarketCap.constants';
import { ICoinMarketCapOptions } from './types/coinMarketCap.interface';
import { AxiosError } from 'axios';

@Injectable()
export class CoinMarketCapService {
	private readonly logger = new Logger(CoinMarketCapService.name);
	private readonly apiKey: string;
	private readonly apiUrl: string;

	constructor(
		@Inject(COINMARKETCAP_MODULE_OPTIONS) options: ICoinMarketCapOptions,
		private readonly httpService: HttpService, // Внедряем HttpService
	) {
		this.apiKey = options.apiKey;
		this.apiUrl = options.apiUrl;
	}

	async fetchPricesByUCID(ucids: string[]): Promise<Record<string, number>> {
		try {
			const response$ = this.httpService.get(this.apiUrl, {
				params: { id: ucids.join(','), convert: 'USD' },
				headers: { 'X-CMC_PRO_API_KEY': this.apiKey },
			});

			const response = await firstValueFrom(response$);

			const prices: Record<string, number> = {};
			for (const ucid of ucids) {
				prices[ucid] = response.data.data[ucid]?.quote?.USD?.price || null;
			}
			return prices;
		} catch (error: unknown) {
			if (error instanceof AxiosError) {
				const status = error.response?.status || 'UNKNOWN';
				const message = error.response?.data || error.message;
				this.logger.error(`Error fetching prices from CoinMarketCap (Status: ${status})`, message);
			} else {
				this.logger.error(`Unexpected error in fetchPricesByUCID`, error);
			}
			return {};
		}
	}
}
