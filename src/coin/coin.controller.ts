import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoinService } from './coin.service';
import { CoinDto } from './dto/coin.dto';

@Controller('coin')
export class CoinController {
	constructor(private readonly coinService: CoinService) {}

	@Post('add')
	async addCoin(@Body() coinDto: CoinDto) {
		return this.coinService.addCoin(coinDto);
	}

	@Get()
	async getAllCoins() {
		return this.coinService.getAllCoins();
	}

	@Get(':ucid')
	async getCoinByUcid(@Param('ucid') ucid: string) {
		return this.coinService.getCoinByUcid(ucid);
	}
}
