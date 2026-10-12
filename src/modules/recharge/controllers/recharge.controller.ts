import { Controller } from '@nestjs/common';
import { RechargeService } from '../services/recharge.service';

@Controller('recharge')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}
}
