import { ConfigService } from '@nestjs/config';
import { ViemOptions } from 'src/viem/types/viem.interface';

export const getViemConfig = (configService: ConfigService): ViemOptions => {
	const privateKey = configService.get('PRIVAT_KEY');
	if (!privateKey) {
		throw new Error('PRIVAT_KEY не задан');
	}

	return {
		privateKey,
	};
};
