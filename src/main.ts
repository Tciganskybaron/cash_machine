import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	const reflector = app.get(Reflector); // Getting the Reflector
	const jwtAuthGuard = new JwtAuthGuard(reflector); // Passing the Reflector to the Guard
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // игнорировать поля, которых нет в DTO
			forbidNonWhitelisted: true, // выбрасывать ошибку, если пришли «лишние» поля
			transform: true, // преобразовывать примитивы к нужному типу, если @Type(() => Number)
		}),
	);

	app.useGlobalGuards(jwtAuthGuard); // Setting the global Guard
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
