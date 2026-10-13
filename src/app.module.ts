import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { RechargeModule } from './modules/recharge/recharge.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import apiConfig from './config/api.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
      load: [apiConfig, databaseConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (
        config: ConfigType<typeof databaseConfig>,
      ) => ({
        type: 'postgres',
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: config.database,
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
      }),
    }),
    SupplierModule,
    RechargeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}