import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Checking if the route is public (does not require authentication)
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true; // If it's public, bypass the Guard
		}

		// Checking the validity of the token
		const isAuthorized = (await super.canActivate(context)) as boolean;
		if (!isAuthorized) {
			throw new UnauthorizedException('Invalid token');
		}

		return true;
	}
}
