import { RechargeStatus } from '../enums/recharge-status.enum';

export class RechargeDto {
  id: string;
  supplierId: string;
  supplierName: string;
  cellPhone: string;
  value: number;
  status: RechargeStatus;
  transactionalId: string | null;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
}
