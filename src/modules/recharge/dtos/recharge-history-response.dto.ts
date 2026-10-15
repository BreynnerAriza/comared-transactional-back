import { RechargeHistoryItemDto } from './recharge-history-item.dto';

export class RechargeHistoryResponseDto {
  data: RechargeHistoryItemDto[];

  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };

}