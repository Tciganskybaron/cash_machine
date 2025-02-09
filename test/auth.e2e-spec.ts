import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { disconnect } from 'mongoose';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { USER_NOT_FOUND_ERROR } from 'src/auth/constants/auth.constants';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

const loginDto: AuthDto = {
	email: 'a@a.ru',
	password: 'password',
};

describe('Auth (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();

		const reflector = app.get(Reflector);
		app.useGlobalGuards(new JwtAuthGuard(reflector));
		await app.init();
	});

	afterAll(async () => {
		await disconnect();
		await app.close();
	});

	it('/auth/login(POST) - fail login', async () => {
		const res = await request(app.getHttpServer()).post('/auth/login').send(loginDto).expect(401);
		const message = res.body.message;
		expect(message).toBe(USER_NOT_FOUND_ERROR);
	});
});
