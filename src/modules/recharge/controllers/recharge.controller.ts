import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RechargeService } from '../services/recharge.service';
import { RechargeBuyRequestDto } from '../dto/recharge-buy-request.dto';
import { RechargeBuyResponse } from '../interfaces/recharge-buy-response.interface';
import { CurrentUser } from '../../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/dtos/authenticated-user.interface';
import { RechargeHistoryQueryDto } from '../dto/recharge-history-query.dto';

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

  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RechargeHistoryQueryDto,
  ) {
    return this.rechargeService.getHistory(user.id, query);
  }

}
