// viem.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { createPublicClient, http, createWalletClient, formatEther, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { VIEM_MODULE_OPTIONS } from './constants/viem.constants';
import {
	ChainId,
	ChainClients,
	ViemOptions,
	CHAIN_CONFIG,
	SUPPORTED_CHAINS,
} from './types/viem.interface';
import { ISendEthParams, ISendTransactionParams } from './types/viem.params';
import BigNumber from 'bignumber.js';

@Injectable()
export class ViemService {
	private chainClients: Map<ChainId, ChainClients> = new Map();
	public account: ReturnType<typeof privateKeyToAccount>;

	constructor(@Inject(VIEM_MODULE_OPTIONS) options: ViemOptions) {
		this.account = privateKeyToAccount(options.privateKey);

		// Используем SUPPORTED_CHAINS вместо Object.values
		SUPPORTED_CHAINS.forEach((chainId) => {
			const chain = CHAIN_CONFIG[chainId];

			const publicClient = createPublicClient({
				chain,
				transport: http(),
			});

			const walletClient = createWalletClient({
				chain,
				transport: http(),
				account: this.account,
			});

			this.chainClients.set(chainId, { publicClient, walletClient });
		});
	}

	private getClients(chainId: ChainId): ChainClients {
		const clients = this.chainClients.get(chainId);
		if (!clients) {
			throw new Error(`Сеть ${chainId} не поддерживается`);
		}
		return clients;
	}

	async getBalance(address: `0x${string}`, chainId: ChainId) {
		const { publicClient } = this.getClients(chainId);
		const balance = await publicClient.getBalance({ address });
		return formatEther(balance);
	}

	async sendEth(params: ISendEthParams) {
		try {
			const { amount, recipient, chainId } = params;
			const { walletClient } = this.getClients(chainId);

			const request = await walletClient.prepareTransactionRequest({
				account: this.account,
				to: recipient,
				value: parseEther(amount),
				chain: CHAIN_CONFIG[chainId],
			});

			const serializedTransaction = await walletClient.signTransaction({
				...request,
				account: this.account,
			});

			const hash = await walletClient.sendRawTransaction({
				serializedTransaction,
			});

			return hash;
		} catch (error) {
			throw new Error(`🚨 Ошибка при отправке Ether в сети ${params.chainId}: ${error}`);
		}
	}

	async sendTransaction(
		params: ISendTransactionParams,
	): Promise<{ txHash: `0x${string}`; status: 'success' | 'reverted' }> {
		try {
			const { to, data, value, chainId } = params;
			const { publicClient, walletClient } = this.getClients(chainId);

			const gasPrice = await publicClient.getGasPrice();

			const txHash = await walletClient.sendTransaction({
				to,
				data,
				value: BigInt(value),
				gasPrice,
				account: this.account,
				chain: CHAIN_CONFIG[chainId],
			});

			const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

			return { txHash, status: receipt.status };
		} catch (error) {
			throw new Error(
				`🚨 Ошибка при выполнении sendTransaction в сети ${params.chainId}: ${error}`,
			);
		}
	}

	// Получить баланс ERC20 токена для текущего кошелька в указанной сети
	async getTokenBalance(chainId: ChainId, tokenAddress: string): Promise<BigNumber> {
		const { publicClient } = this.getClients(chainId);
		const erc20Abi = [
			{
				type: 'function',
				name: 'balanceOf',
				stateMutability: 'view',
				inputs: [{ name: 'account', type: 'address' }],
				outputs: [{ type: 'uint256' }],
			},
		];

		const balance = await publicClient.readContract({
			address: tokenAddress as `0x${string}`,
			abi: erc20Abi,
			functionName: 'balanceOf',
			args: [this.account.address],
		});

		const validValue = (n: unknown): n is string | number | bigint =>
			typeof n === 'string' || typeof n === 'number' || typeof n === 'bigint';

		return validValue(balance) ? new BigNumber(String(balance)) : new BigNumber(0);
	}
}
