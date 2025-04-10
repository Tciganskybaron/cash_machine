// test/coin.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CoinDto } from '../src/coin/dto/coin.dto';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMongoConfig } from 'src/configs/mongo.config';
import { Model } from 'mongoose';
import { Coin } from '../src/coin/model/coin.model';
import { getModelToken } from '@nestjs/mongoose';

describe('CoinController (e2e)', () => {
	let app: INestApplication;
	let coinModel: Model<Coin>;
	let createdCoin: any;
	const coinDto: CoinDto = {
		ucid: '1975',
		name: 'Bitcoin',
		symbol: 'BTC',
		decimals: 16,
		isTrading: false,
		chain_addresses: [
			{
				chain_id: 1,
				address: '1975',
			},
		],
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot(),
				MongooseModule.forRootAsync({
					imports: [ConfigModule],
					useFactory: getMongoConfig,
					inject: [ConfigService],
				}),
				AppModule,
			],
		}).compile();

		app = moduleFixture.createNestApplication();
		coinModel = moduleFixture.get<Model<Coin>>(getModelToken(Coin.name));
		await app.init();
	}, 30000);

	beforeEach(async () => {
		// Проверяем и удаляем монету с ucid: '1975' если она существует
		const existingCoin = await coinModel.findOne({ ucid: '1975' });
		if (existingCoin) {
			await coinModel.deleteOne({ ucid: '1975' });
		}
	});

	afterAll(async () => {
		await app.close();
	});

	describe('/coin/add (POST)', () => {
		it('должен создать новую монету', async () => {
			const response = await request(app.getHttpServer())
				.post('/coin/add')
				.send(coinDto)
				.expect(201);

			createdCoin = response.body;
			expect(createdCoin.ucid).toBe(coinDto.ucid);
			expect(createdCoin.name).toBe(coinDto.name);
		});

		it('не должен создавать дубликат монеты', async () => {
			// Сначала создаем монету
			await request(app.getHttpServer()).post('/coin/add').send(coinDto).expect(201);

			// Пытаемся создать дубликат
			await request(app.getHttpServer()).post('/coin/add').send(coinDto).expect(409);
		});

		it('должен валидировать входные данные', async () => {
			const invalidCoinDto = {
				ucid: '', // пустой ucid
				name: 'Bitcoin',
				symbol: 'BTC',
				decimals: 16,
				isTrading: false,
				chain_addresses: [
					{
						chain_id: 1,
						address: '1975',
					},
				],
			};

			const response = await request(app.getHttpServer())
				.post('/coin/add')
				.send(invalidCoinDto)
				.expect(400);

			expect(response.body.message).toContain('ucid');
		});
	});

	describe('/coin (GET)', () => {
		it('должен вернуть все монеты', async () => {
			// Создаем монету перед тестом
			await request(app.getHttpServer()).post('/coin/add').send(coinDto).expect(201);

			const response = await request(app.getHttpServer()).get('/coin').expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);
		});

		it('должен вернуть пустой массив когда нет монет', async () => {
			// Удаляем все монеты
			await coinModel.deleteMany({});

			const response = await request(app.getHttpServer()).get('/coin').expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBe(0);
		});
	});

	describe('/coin/:ucid (GET)', () => {
		it('должен вернуть монету по ucid', async () => {
			// Создаем монету перед тестом
			const createResponse = await request(app.getHttpServer())
				.post('/coin/add')
				.send(coinDto)
				.expect(201);

			const response = await request(app.getHttpServer())
				.get(`/coin/${createResponse.body.ucid}`)
				.expect(200);

			expect(response.body.ucid).toBe(createResponse.body.ucid);
		});

		it('должен вернуть 404 для несуществующей монеты', () => {
			return request(app.getHttpServer()).get('/coin/nonexistent').expect(404);
		});
	});

	describe('/coin/:ucid (DELETE)', () => {
		it('должен удалить монету по ucid', async () => {
			// Создаем монету перед тестом
			const createResponse = await request(app.getHttpServer())
				.post('/coin/add')
				.send(coinDto)
				.expect(201);

			await request(app.getHttpServer()).delete(`/coin/${createResponse.body.ucid}`).expect(200);
		});

		it('должен вернуть 404 при попытке удалить несуществующую монету', async () => {
			await request(app.getHttpServer()).delete('/coin/nonexistent').expect(404);
		});
	});

	describe('Дополнительные проверки', () => {
		it('должен правильно обрабатывать isTrading флаг', async () => {
			const tradingCoinDto = {
				...coinDto,
				ucid: '1976',
				isTrading: true,
			};

			const response = await request(app.getHttpServer())
				.post('/coin/add')
				.send(tradingCoinDto)
				.expect(201);

			expect(response.body.isTrading).toBe(true);
		});

		it('должен правильно обрабатывать chain_addresses', async () => {
			const coinWithMultipleChains = {
				...coinDto,
				ucid: '1977',
				chain_addresses: [
					{
						chain_id: 1,
						address: '1977',
					},
					{
						chain_id: 56,
						address: '0x1977',
					},
				],
			};

			const response = await request(app.getHttpServer())
				.post('/coin/add')
				.send(coinWithMultipleChains)
				.expect(201);

			expect(response.body.chain_addresses).toHaveLength(2);
			expect(response.body.chain_addresses[0].chain_id).toBe(1);
			expect(response.body.chain_addresses[1].chain_id).toBe(56);
		});
	});
});
