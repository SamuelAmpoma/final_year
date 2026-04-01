import { DataSource } from 'typeorm';
import { Vehicle } from '../entities/Vehicle';
import { LocationHistory } from '../entities/LocationHistory';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'emergency_db',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Vehicle, LocationHistory],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
