import { Inject, Injectable } from '@nestjs/common';
import {
	PublicClient,
	Transport,
	WalletClient,
	createPublicClient,
	http,
	createWalletClient,
	formatEther,
	parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { VIEM_MODULE_OPTIONS } from './constants/viem.constants';
import { ViemOptions } from './types/viem.interface';
import { ISendEthParams, ISendTransactionParams } from './types/viem.params';

@Injectable()
export class ViemService {
	private publicClient: PublicClient<Transport, typeof base>;
	private walletClient: WalletClient<Transport, typeof base>;
	public account: ReturnType<typeof privateKeyToAccount>;

	constructor(@Inject(VIEM_MODULE_OPTIONS) options: ViemOptions) {
		this.account = privateKeyToAccount(options.privateKey);

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
				value: BigInt(value),
				gasPrice,
				account: this.account,
			});

			const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

			return { txHash, status: receipt.status };
		} catch (error) {
			throw new Error(`🚨 Ошибка при выполнеии sendTransaction : ${error}`);
		}
	}
}
