import { Address } from 'viem';
import { ChainId } from './viem.interface';

export interface ISendTransactionParams {
	to: Address;
	data: Address;
	value: string;
	chainId: ChainId; // Добавляем chainId
}

export interface ISendEthParams {
	amount: string;
	recipient: Address;
	chainId: ChainId; // Добавляем chainId
}
