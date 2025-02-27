import { Address } from 'viem';

export interface IBestQuoteForSwapParams {
	src: Address;
	dst: Address;
	amount: string | bigint;
	fee?: number;
	complexityLevel?: string;
	parts?: string;
	mainRouteParts?: string;
	gasLimit?: string | bigint;
	includeTokensInfo?: boolean;
	includeProtocols?: boolean;
	includeGas?: boolean;
}

export interface ISwapTokensParams {
	src: Address;
	dst: Address;
	amount: string | bigint;
	from: Address;
	origin: Address;
	slippage: number;
	fee?: string | bigint;
	gasPrice?: string | bigint;
	complexityLevel?: string;
	parts?: string;
	mainRouteParts?: string;
	gasLimit?: string | bigint;
	includeTokensInfo?: boolean;
	includeProtocols?: boolean;
	includeGas?: boolean;
	receiver?: Address;
	allowPartialFill?: boolean;
	disableEstimate?: boolean;
	usePermit2?: boolean;
}

export interface IApproveTokenParams {
	tokenAddress: Address;
	amount: string | bigint;
}

export interface ISendTransactionParams {
	to: Address;
	data: `0x${string}`;
	value?: string;
}

export interface ISendEthParams {
	amount: string;
	recipient: Address;
}
