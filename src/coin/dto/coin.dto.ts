import { IsBoolean, IsDefined, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChainAddressDto {
	@IsDefined()
	@IsNumber()
	chain_id: number; // ID блокчейна

	@IsDefined()
	@IsString()
	address: string; // Адрес контракта токена
}

export class CoinDto {
	@IsDefined()
	@IsString()
	ucid: string;

	@IsDefined()
	@IsString()
	symbol: string;

	@IsDefined()
	@IsString()
	name: string;

	@IsDefined()
	@IsNumber()
	decimals: number;

	@IsDefined()
	@IsBoolean()
	isTrading: boolean;

	@IsDefined()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ChainAddressDto)
	chain_addresses: ChainAddressDto[];
}
