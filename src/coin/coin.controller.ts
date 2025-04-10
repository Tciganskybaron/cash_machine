import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { CoinService } from './coin.service';
import { CoinDto } from './dto/coin.dto';

@Controller('coin')
export class CoinController {
	constructor(private readonly coinService: CoinService) {}

	@Post('add')
	@UsePipes(new ValidationPipe({ transform: true }))
	async addCoin(@Body() coinDto: CoinDto) {
		return this.coinService.addCoin(coinDto);
	}

	@Post(':ucid')
	async addCoinFromCoinMarketCap(@Param('ucid') ucid: string) {
		return this.coinService.addCoinFromCoinMarketCap(ucid);
	}

	@Get()
	async getAllCoins() {
		return this.coinService.getAllCoins();
	}

	@Get(':ucid')
	async getCoinByUcid(@Param('ucid') ucid: string) {
		return this.coinService.getCoinByUcid(ucid);
	}

	@Delete(':ucid')
	async deleteCoinByUcid(@Param('ucid') ucid: string) {
		return this.coinService.deleteCoinByUcid(ucid);
	}
}
