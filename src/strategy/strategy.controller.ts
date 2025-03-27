import { Body, Controller, Post } from '@nestjs/common';
import { StrategyDto } from './dto/strategy.dto';
import { StrategyService } from './strategy.service';
import { StrategySpecialLinesDto } from './dto/stratege.specialLines.dto';

@Controller('strategy')
export class StrategyController {
	constructor(private readonly strategyService: StrategyService) {}

	@Post('create')
	async createStrategy(@Body() data: StrategyDto) {
		return this.strategyService.createStrategy(data);
	}

	@Post('createSpecialLines')
	async createStrategySpecialLines(@Body() data: StrategySpecialLinesDto) {
		return this.strategyService.createStrategySpecialLines(data);
	}
}
