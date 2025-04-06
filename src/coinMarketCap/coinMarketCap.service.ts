import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { COINMARKETCAP_MODULE_OPTIONS } from './constants/coinmarketcap.constants';
import { ICoinMarketCapOptions } from './types/coinmarketcap.interface';

@Injectable()
export class CoinMarketCapService {
	private readonly logger = new Logger(CoinMarketCapService.name);
	private readonly apiKey: string;
	private readonly apiUrl: string;

	constructor(@Inject(COINMARKETCAP_MODULE_OPTIONS) options: ICoinMarketCapOptions) {
		this.apiKey = options.apiKey;
		this.apiUrl = options.apiUrl;
	}

	async fetchPricesByUCID(ucids: string[]): Promise<Record<string, number>> {
		try {
			// Запрос к CoinMarketCap
			const response = await axios.get(this.apiUrl, {
				params: { id: ucids.join(','), convert: 'USD' },
				headers: { 'X-CMC_PRO_API_KEY': this.apiKey },
			});

			// Составляем объект с ценами
			const prices: Record<string, number> = {};
			for (const ucid of ucids) {
				prices[ucid] = response.data.data[ucid]?.quote?.USD?.price || null;
			}
			return prices;
		} catch (error) {
			if (error instanceof AxiosError) {
				const statusCode = error.response?.status || 'UNKNOWN';
				const message = error.response?.data || error.message;

				throw new HttpException(
					`Error fetching prices from CoinMarketCap (Status: ${statusCode}): ${JSON.stringify(message)}`,
					HttpStatus.BAD_GATEWAY,
				);
			}
			throw new InternalServerErrorException(`Unexpected error in fetchPricesByUCID: ${error}`);
		}
	}
}
