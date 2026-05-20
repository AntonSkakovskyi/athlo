import 'dotenv/config';
import { DataSource } from 'typeorm';

const sslDisabled = process.env.DATABASE_SSL === 'false';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  ssl: sslDisabled ? false : { rejectUnauthorized: false },
});
