import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        await dataSource.initialize();
        return dataSource.options;
      },
    }),
  ],
})
export class DatabaseModule {}
