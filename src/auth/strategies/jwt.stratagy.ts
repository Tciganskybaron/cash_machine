import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Auth } from '../model/auth.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
		const jwtSecret = configService.get<string>('JWT_SECRET');
		if (!jwtSecret) {
			throw new Error('JWT_SECRET is not defined');
		}

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: jwtSecret,
		});
	}

	async validate({ email }: Pick<Auth, 'email'>) {
		return { email: email };
	}
}
