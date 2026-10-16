import { Module } from '@nestjs/common';
import { RechargeController } from './controllers/recharge.controller';
import { RechargeService } from './services/recharge.service';
import { RechargeEntity } from './entities/recharge.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RechargeRepository } from './repositories/recharge.repository';
import { ComaredModule } from '../../integrations/comared/comared.module';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  imports: [
    ComaredModule,
    SupplierModule,
    TypeOrmModule.forFeature([RechargeEntity]),
  ],
  controllers: [RechargeController],
  providers: [RechargeService, RechargeRepository],
})
export class RechargeModule {}
