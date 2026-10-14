import { Body, Controller, Post } from '@nestjs/common';
import { RechargeService } from '../services/recharge.service';
import { RechargeBuyRequestDto } from '../dto/recharge-buy-request.dto';
import { RechargeBuyResponse } from '../interfaces/recharge-buy-response.interface';
import { CurrentUser } from '../../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/dtos/authenticated-user.interface';

@Controller('recharge')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Post()
  async buy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: RechargeBuyRequestDto,
  ): Promise<RechargeBuyResponse> {
    return this.rechargeService.buy(user.id, request);
  }
  
}