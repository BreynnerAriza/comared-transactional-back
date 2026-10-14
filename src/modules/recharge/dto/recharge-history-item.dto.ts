import { RechargeStatus } from '../enums/recharge-status.enum';

export class RechargeHistoryItemDto {
  id: string;
  supplierName: string;
  cellPhone: string;
  amount: number;
  status: RechargeStatus;
  transactionalId: string | null;
  providerMessage: string | null;
  createdAt: Date;
}