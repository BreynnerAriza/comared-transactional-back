import { Module } from '@nestjs/common';
import { RechargeController } from './controllers/recharge.controller';
import { RechargeService } from './services/recharge.service';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  imports: [SupplierModule],
  controllers: [RechargeController],
  providers: [RechargeService],
})
export class RechargeModule {}
