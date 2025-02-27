import { Inject, Injectable } from '@nestjs/common';
import { ONEINCH_MODULE_OPTIONS } from './constants/1inch.constants';
import { I1InchOptions } from './types/1inch.interface';
import {
	createPublicClient,
	createWalletClient,
	PublicClient,
	WalletClient,
	http,
	Transport,
	formatEther,
	parseEther,
} from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IRequestError, IQuoteResponse, TransactionData } from './types/1inch.responce';
import {
	IApproveTokenParams,
	IBestQuoteForSwapParams,
	ISendEthParams,
	ISendTransactionParams,
	ISwapTokensParams,
} from './types/1inch.params';

@Injectable()
export class OneInchService {
	private publicClient: PublicClient<Transport, typeof base>;
	private walletClient: WalletClient<Transport, typeof base>;
	private account: ReturnType<typeof privateKeyToAccount>;
	private api1InchBaseUrl: string;
	private axiosConfig: AxiosRequestConfig;

	constructor(@Inject(ONEINCH_MODULE_OPTIONS) options: I1InchOptions) {
		let privateKey = options.privateKey;
		this.api1InchBaseUrl = options.api1InchBaseUrl;
		this.axiosConfig = {
			headers: {
				Authorization: `Bearer ${options.apiKey1inch}`,
				accept: 'application/json',
			},
			paramsSerializer: {
				indexes: null,
			},
		};

		if (!privateKey.startsWith('0x')) {
			privateKey = '0x' + privateKey;
		}

		this.account = privateKeyToAccount(privateKey as `0x${string}`);

		this.publicClient = createPublicClient({
			chain: base,
			transport: http(),
		});

		this.walletClient = createWalletClient({
			chain: base,
			transport: http(),
			account: this.account,
		});
	}

	async getBalance(address: `0x${string}`) {
		const balance = await this.publicClient.getBalance({ address });
		return formatEther(balance);
	}

	apiRequestUrl = (chainId: string | number, methodName: string) => {
		return `${this.api1InchBaseUrl}${chainId}${methodName}`;
	};

	async sendEth(params: ISendEthParams) {
		try {
			const { amount, recipient } = params;

			// Подготовка транзакции с объектом account
			const request = await this.walletClient.prepareTransactionRequest({
				account: this.account,
				to: recipient,
				value: parseEther(amount),
			});

			// Подписание транзакции
			const serializedTransaction = await this.walletClient.signTransaction({
				...request,
				account: this.account,
			});

			//Отправка транзакции
			const hash = await this.walletClient.sendRawTransaction({
				serializedTransaction,
			});

			return hash;
		} catch (error) {
			throw new Error(`🚨 Ошибка при отправке Ether : ${error}`);
		}
	}

	async sendTransaction(
		params: ISendTransactionParams,
	): Promise<{ txHash: `0x${string}`; status: 'success' | 'reverted' }> {
		try {
			const gasPrice = await this.publicClient.getGasPrice();

			const { to, data, value } = params;

			const txHash = await this.walletClient.sendTransaction({
				to,
				data,
				value: BigInt(value || '0'),
				gasPrice,
				account: this.account,
			});

			const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
			if (receipt.status === 'reverted') {
				console.log(`❌ Ошибка при выполнении sendTransaction! Статус: ${receipt.status}`);
			}
			return { txHash, status: receipt.status };
		} catch (error) {
			throw new Error(`🚨 Ошибка при выполнеии sendTransaction : ${error}`);
		}
	}

	async approveToken(
		params: IApproveTokenParams,
		chainId: string | number,
	): Promise<{ txHash: `0x${string}`; status: 'success' | 'reverted' }> {
		try {
			const url = this.apiRequestUrl(chainId, '/approve/transaction');

			const response: AxiosResponse<TransactionData> = await axios.get(url, {
				...this.axiosConfig,
				params,
			});

			const { data, to, value } = response.data;

			return await this.sendTransaction({
				to: to,
				data: data,
				value: value,
			});
		} catch (error) {
			throw new Error(`🚨 Ошибка при одобрении токенов: ${error}`);
		}
	}

	/**
	 * Classic Quote swap
	 * Получает наилучший ценовой курс для обмена токенов через 1inch router.
	 * Отправляет GET-запрос к API 1inch для получения котировки обмена.
	 *
	 * @param {Object} params - Параметры запроса
	 * @param {Address} params.src - Адрес контракта токена для продажи (обязательный параметр)
	 * @param {Address} params.dst - Адрес контракта токена для покупки (обязательный параметр)
	 * @param {string | bigint} params.amount - Количество токенов для продажи в минимальных делимых единицах (обязательный параметр)
	 * @param {number} [params.fee] - Процент комиссии от суммы src токена, который будет отправлен рефералу (от 0 до 3, по умолчанию 0)
	 * @param {string} [params.complexityLevel] - Максимальное количество токен-коннекторов, используемых в маршруте (от 0 до 3, по умолчанию 2)
	 * @param {string} [params.parts] - Максимальное количество частей, на которые может быть разделен основной маршрут (по умолчанию 20, макс. 100)
	 * @param {string} [params.mainRouteParts] - Максимальное количество частей основного маршрута (по умолчанию 20, макс. 50)
	 * @param {string | bigint} [params.gasLimit] - Максимальное количество газа для свапа (по умолчанию 11500000)
	 * @param {boolean} [params.includeTokensInfo] - Включать ли информацию о токенах в ответе (по умолчанию false)
	 * @param {boolean} [params.includeProtocols] - Включать ли информацию о протоколах в ответе (по умолчанию false)
	 * @param {boolean} [params.includeGas] - Включать ли информацию о предполагаемом газе (по умолчанию false)
	 * @param {numbre | string} [chainId] - ID сети
	 *
	 * @returns {IQuoteResponse} Объект с данными о котировке обмена, включая информацию о маршруте и затратах газа.
	 *
	 * @throws {IRequestError} Выводит ошибку в консоль в случае сбоя запроса.
	 */
	async BestQuoteForSwap(
		params: IBestQuoteForSwapParams,
		chainId: string | number, // ID сети
	): Promise<IQuoteResponse> {
		const url = this.apiRequestUrl(chainId, '/quote');

		const config = {
			...this.axiosConfig,
			params,
		};

		try {
			const response = await axios.get<IQuoteResponse>(url, config);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const errorData: IRequestError = error.response.data;
				throw new Error(
					`1inch API Error: ${errorData.description} (Status: ${errorData.statusCode})`,
				);
			}

			throw new Error(`🚨 Ошибка получения котировки для свапа: ${error}`);
		}
	}

	/**
	 * Classic swap
	 * Формирует данные для вызова 1inch router с целью обмена токенов.
	 * Отправляет POST-запрос к API 1inch для выполнения свапа.
	 *
	 * @param {Object} params - Параметры запроса
	 * @param {Address} params.src - Адрес контракта токена для продажи (обязательный параметр)
	 * @param {Address} params.dst - Адрес контракта токена для покупки (обязательный параметр)
	 * @param {string | bigint} params.amount - Количество токенов для продажи в минимальных делимых единицах (обязательный параметр)
	 * @param {Address} params.from - Адрес отправителя (обязательный параметр, должен иметь одобрение на `src` токен)
	 * @param {Address} params.origin - Адрес инициатора транзакции (обязательный параметр, для KYC/AML)
	 * @param {number} params.slippage - Допустимый процент проскальзывания (0-50, например, 0.5% указывается как 0.5)
	 * @param {string | bigint} [params.fee] - Процент комиссии, отправляемый рефералу (0-3, по умолчанию 0)
	 * @param {string | bigint} [params.gasPrice] - Цена газа в wei (по умолчанию "fast" от сети)
	 * @param {string} [params.complexityLevel] - Уровень сложности маршрута (0-3, по умолчанию 2)
	 * @param {string} [params.parts] - Макс. число частей маршрута (по умолчанию 20, макс. 100)
	 * @param {string} [params.mainRouteParts] - Макс. число частей основного маршрута (по умолчанию 20, макс. 50)
	 * @param {string | bigint} [params.gasLimit] - Лимит газа для свапа (по умолчанию 11500000)
	 * @param {boolean} [params.includeTokensInfo] - Включать информацию о токенах в ответе (по умолчанию false)
	 * @param {boolean} [params.includeProtocols] - Включать информацию о протоколах в ответе (по умолчанию false)
	 * @param {boolean} [params.includeGas] - Включать предполагаемые затраты газа (по умолчанию false)
	 * @param {Address} [params.receiver] - Адрес получателя купленного токена (если не указан, используется `from`)
	 * @param {boolean} [params.allowPartialFill] - Разрешать частичное выполнение свапа (по умолчанию true)
	 * @param {boolean} [params.disableEstimate] - Отключить проверку расчетов (по умолчанию false)
	 * @param {boolean} [params.usePermit2] - Использовать Permit2 для одобрения (по умолчанию false)
	 * @param {number | string} chainId - ID сети
	 *
	 * @returns {ISwapResponse} Объект с данными для выполнения транзакции.
	 *
	 * @throws {IRequestError} Ошибка запроса в случае сбоя API.
	 */
	async swapTokens(
		params: ISwapTokensParams,
		chainId: string | number,
	): Promise<{ txHash: `0x${string}`; status: 'success' | 'reverted' }> {
		try {
			const url = this.apiRequestUrl(chainId, '/swap');
			const response = await axios.get(url, {
				...this.axiosConfig,
				params,
			});

			const { data, to, value } = response.data.tx;

			return await this.sendTransaction({
				to: to,
				data: data,
				value: value,
			});
		} catch (error) {
			throw new Error(`🚨 Ошибка при обмене токенов: ${error}`);
		}
	}
}
