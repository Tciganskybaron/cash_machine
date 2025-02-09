import { ConfigService } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export const getMongoConfig = async (
	configService: ConfigService,
): Promise<MongooseModuleFactoryOptions> => {
	const uri = configService.get<string>('MONGO_URI');
	return {
		uri,
		retryAttempts: 10, // Number of reconnection attempts
		retryDelay: 5000, // Delay between attempts in milliseconds
		connectionFactory: (connection) => {
			// Setting global Mongoose parameters
			mongoose.set('strictQuery', true);
			return connection;
		},
		verboseRetryLog: true, // Logging reconnection attempts
		socketTimeoutMS: 45000, // Maximum socket timeout
		connectTimeoutMS: 10000, // Connection timeout
		maxPoolSize: 10, // Maximum connection pool size
		minPoolSize: 2, // Minimum connection pool size
		serverSelectionTimeoutMS: 10000, // Server selection timeout
		writeConcern: {
			w: 'majority', // Write acknowledgment on most replicas
			j: true, // Write acknowledgment after journal commit
		},
	};
};
