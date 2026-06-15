import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSource = new DataSource({
  type: 'sqljs',
  location: path.resolve(process.env.DB_PATH || './data/hotel_iot.db'),
  autoSave: true,
  entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
  synchronize: true,
  logging: false,
  migrations: [path.join(__dirname, './migrations/**/*{.ts,.js}')],
  subscribers: [],
});
