import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RechargeService } from '../services/recharge.service';
import { RechargeBuyRequestDto } from '../dto/recharge-buy-request.dto';
import { RechargeBuyResponseDto } from '../dto/recharge-buy-response.dto';
import { CurrentUser } from '../../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/dtos/authenticated-user.interface';
import { RechargeHistoryQueryDto } from '../dto/recharge-history-query.dto';
import { RechargeHistoryResponseDto } from '../dto/recharge-history-response.dto';

@Controller('recharge')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Post()
  async buy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: RechargeBuyRequestDto,
  ): Promise<RechargeBuyResponseDto> {
    return this.rechargeService.buy(user.id, request);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RechargeHistoryQueryDto,
  ): Promise<RechargeHistoryResponseDto> {
    return this.rechargeService.getHistory(user.id, query);
  }
}
