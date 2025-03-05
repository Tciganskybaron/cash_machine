import { Controller, Get, Param } from '@nestjs/common';
import { OneInchService } from './1inch.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('1inch')
export class OneInchController {
	constructor(private readonly oneInchService: OneInchService) {}

	@Get('getBalance/:address')
	async getBalance(@Param('address') address: `0x${string}`) {
		return this.oneInchService.getBalance(address);
	}

	@Public()
	@Get('swapQuote')
	async getSwapQuote() {
		return this.oneInchService.BestQuoteForSwap(
			{
				src: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
				dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
				amount: '10000000000000000000',
				fee: 0,
				complexityLevel: '1',
				parts: '10',
				mainRouteParts: '10',
				gasLimit: '300000',
				includeTokensInfo: true,
				includeProtocols: true,
				includeGas: true,
			},
			8453,
		);
		// return this.oneInchService.swapTokens(
		// 	{
		// 		src: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
		// 		dst: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
		// 		amount: '10000000000000000000',
		// 		from: '0xd32D16373CC84FCD9793E58B0D25AE6DC88f1f1b',
		// 		origin: '0xd32D16373CC84FCD9793E58B0D25AE6DC88f1f1b',
		// 		slippage: 1,
		// 		fee: '0',
		// 		gasPrice: '30000000000',
		// 		complexityLevel: '1',
		// 		parts: '10',
		// 		mainRouteParts: '10',
		// 		gasLimit: '369940',
		// 		includeTokensInfo: true,
		// 		includeProtocols: true,
		// 		includeGas: true,
		// 		receiver: '0xd32D16373CC84FCD9793E58B0D25AE6DC88f1f1b',
		// 		allowPartialFill: false,
		// 		disableEstimate: false,
		// 		usePermit2: false,
		// 	},
		// 	8453,
		// );
		// return this.oneInchService.approveToken(
		// 	{
		// 		tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
		// 		amount: '10000000000000000000',
		// 	},
		// 	8453,
		// );
	}
}
