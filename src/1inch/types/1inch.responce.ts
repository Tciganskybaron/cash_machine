import { Address } from 'viem';

export interface TransactionData {
	from: Address;
	to: Address;
	data: Address;
	value: string;
	gasPrice: string;
	gas: number;
}

export interface IApproveCallDataResponse {
	to: Address;
	value: string;
	data: Address;
	gasPrice: string;
}

interface ITokenInfo {
	address: Address; // Адрес контракта токена
	symbol: string; // Символ токена (например, "ETH")
	name: string; // Название токена
	decimals: number; // Количество десятичных знаков у токена
	logoURI: string; // Ссылка на логотип токена
	domainVersion?: string; // Версия домена (если есть)
	eip2612?: boolean; // Поддержка EIP-2612 (если есть)
	isFoT?: boolean; // Флаг, указывающий, является ли токен Fee-on-Transfer (если есть)
	tags?: string[]; // Теги токена (если есть)
}

/**
 * Интерфейс выбранного протокола в маршруте свапа
 */
interface SelectedProtocol {
	name: string; // Название протокола (например, "Uniswap", "Balancer")
	part: number; // Доля маршрута, обработанная этим протоколом
	fromTokenAddress: string; // Адрес исходного токена в этом маршруте
	toTokenAddress: string; // Адрес целевого токена в этом маршруте
	gas: number; // Прогнозируемое потребление газа этим протоколом
}

/**
 * Интерфейс ответа на запрос BestQuoteForSwap
 */
export interface IQuoteResponse {
	srcToken: ITokenInfo; // Информация о токене, который продаем
	dstToken: ITokenInfo; // Информация о токене, который покупаем
	dstAmount: string; // Итоговое количество покупаемого токена в минимальных единицах
	protocols: SelectedProtocol[][][]; // Маршрут обмена, состоящий из множества возможных путей
	gas?: number; // Оценочное количество газа для транзакции
}

/**
 * Интерфейс ответа на запрос swapTokens
 */
export interface ISwapResponse {
	srcToken: ITokenInfo;
	dstToken: ITokenInfo;
	dstAmount: string;
	protocols: SelectedProtocol[][][];
	tx: TransactionData;
}

/**
 * Интерфейс дополнительной информации об ошибке
 */
interface IHttpExceptionMeta {
	type: string; // Тип ошибки (например, "ValidationError")
	value: string; // Значение или описание ошибки
}

/**
 * Интерфейс ошибки, возвращаемой API 1inch
 */
export interface IRequestError {
	error: string; // Название ошибки (например, "Bad Request")
	description: string; // Описание ошибки
	statusCode: 400 | 500; // Код состояния HTTP (только 400 или 500)
	requestId: string; // Идентификатор запроса
	meta: IHttpExceptionMeta[]; // Дополнительные сведения об ошибке
}
