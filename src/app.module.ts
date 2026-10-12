import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { RechargeModule } from './modules/recharge/recharge.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import apiConfig from './config/api.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
      load: [apiConfig],
    }),
    SupplierModule,
    RechargeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}