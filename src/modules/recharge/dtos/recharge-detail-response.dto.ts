import { RechargeStatus } from '../enums/recharge-status.enum';

export class RechargeDetailResponseDto {
  id: string;
  supplierId: string;
  supplierName: string;
  cellPhone: string;
  amount: number;
  status: RechargeStatus;
  transactionalId: string | null;
  providerMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
