import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auth, AuthDocument } from './model/auth.model';
import { compare, genSalt, hash } from 'bcryptjs';
import { INVALID_PASSWORD_ERROR, USER_NOT_FOUND_ERROR } from './constants/auth.constants';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		private readonly jwtService: JwtService,
	) {}

	// Will be removed in the next version
	// async createUser(dto: AuthDto): Promise<Auth> {
	// 	const { password, email } = dto;
	// 	const salt = await genSalt(10);
	// 	const passwordHash = await hash(password, salt);
	// 	const newUser = new this.authModel({ email, passwordHash });
	// 	return newUser.save();
	// }

	async findUser(email: string): Promise<Auth | null> {
		return this.authModel.findOne({ email }).exec();
	}

	async validateUser(email: string, password: string): Promise<Pick<Auth, 'email'>> {
		const user = await this.findUser(email);
		if (!user) {
			throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
		}

		const isPasswordValid = await compare(password, user.passwordHash);
		if (!isPasswordValid) {
			throw new UnauthorizedException(INVALID_PASSWORD_ERROR);
		}

		return { email: user.email };
	}

	async login(email: string) {
		const payload = { email };
		return {
			access_token: await this.jwtService.signAsync(payload),
		};
	}
}
