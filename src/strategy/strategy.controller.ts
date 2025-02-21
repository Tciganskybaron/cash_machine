import { Body, Controller, Post } from '@nestjs/common';
import { StrategyDto } from './dto/strategy.dto';
import { StrategyService } from './strategy.service';

@Controller('strategy')
export class StrategyController {
	constructor(private readonly strategyService: StrategyService) {}

	@Post('create')
	async createStrategy(@Body() data: StrategyDto) {
		return this.strategyService.createStrategy(data);
	}
}
