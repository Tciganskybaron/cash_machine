import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	Post,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { ALREADY_REGISTERED_ERROR } from './constants/auth.constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly telegramService: TelegramService,
	) {}

	// Will be removed in the next version
	// @UsePipes(new ValidationPipe())
	// @Post('register')
	// async register(@Body() dto: AuthDto) {
	// 	const oldUser = await this.authService.findUser(dto.email);
	// 	if (oldUser) {
	// 		throw new BadRequestException(ALREADY_REGISTERED_ERROR);
	// 	}
	// 	return this.authService.createUser(dto);
	// }

	@Public()
	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login')
	async login(@Body() { email, password }: AuthDto) {
		const { email: userEmail } = await this.authService.validateUser(email, password);

		const token = this.authService.login(userEmail);

		const message = `В торговом роботе Авторизовались. Почта: ${email}\n`;
		await this.telegramService.sendMessage(message);

		return token;
	}
}
