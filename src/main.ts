import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './guards/jwt.guard';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	const reflector = app.get(Reflector); // Getting the Reflector
	const jwtAuthGuard = new JwtAuthGuard(reflector); // Passing the Reflector to the Guard

	app.useGlobalGuards(jwtAuthGuard); // Setting the global Guard
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
