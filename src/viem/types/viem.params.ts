import { Address } from 'viem';

export interface ISendTransactionParams {
	to: Address;
	data: Address;
	value: string;
}

export interface ISendEthParams {
	amount: string;
	recipient: Address;
}
