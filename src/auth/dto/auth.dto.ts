import { IsDefined, IsEmail, IsString } from 'class-validator';

export class AuthDto {
	@IsDefined()
	@IsString()
	@IsEmail()
	email: string;

	@IsDefined()
	@IsString()
	password: string;
}
