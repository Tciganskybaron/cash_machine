import { ChainId } from 'src/viem/types/viem.interface';

export function validateAndParseChainId(chainId: string | number): ChainId {
	const numericChainId = Number(chainId);

	switch (numericChainId) {
		case ChainId.ETHEREUM:
			return ChainId.ETHEREUM;
		case ChainId.BASE:
			return ChainId.BASE;
		case ChainId.ARBITRUM:
			return ChainId.ARBITRUM;
		default:
			throw new Error(`Неподдерживаемая сеть: ${chainId}`);
	}
}
