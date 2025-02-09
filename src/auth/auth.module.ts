import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from './model/auth.model';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJwtConfig } from 'src/configs/jwt.config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.stratagy';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
	controllers: [AuthController],
	imports: [
		MongooseModule.forFeature([
			{
				name: Auth.name,
				schema: AuthSchema,
			},
		]),
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getJwtConfig,
		}),
		PassportModule,
		TelegramModule,
	],
	providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
