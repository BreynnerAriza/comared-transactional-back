import { ComaredBuyRequestDto } from '../../../integrations/comared/dto/comared-buy-request.dto';
import { ComaredBuyResponseDto } from '../../../integrations/comared/dto/comared-buy-response.dto';
import { RechargeBuyRequestDto } from '../dto/recharge-buy-request.dto';
import { RechargeDto } from '../dto/recharge.dto';
import { RechargeEntity } from '../entities/recharge.entity';
import { RechargeBuyResponse } from '../interfaces/recharge-buy-response.interface';

export class RechargeMapper {
  static toComaredBuyRequest(
    request: RechargeBuyRequestDto,
  ): ComaredBuyRequestDto {
    return {
      supplierId: request.supplierId,
      cellPhone: request.cellPhone,
      value: request.value,
    };
  }

  static toBuyResponse(
    recharge: RechargeEntity,
    response: ComaredBuyResponseDto,
  ): RechargeBuyResponse {
    return {
      rechargeId: recharge.id,
      transactionalID: response.transactionalID,
      message: response.message,
      cellPhone: response.cellPhone,
      value: response.value,
      supplierName: recharge.supplierName,
    };
  }

  static toDto(recharge: RechargeEntity): RechargeDto {
    return {
      id: recharge.id,
      supplierId: recharge.supplierId,
      supplierName: recharge.supplierName,
      cellPhone: recharge.cellPhone,
      value: recharge.amount,
      status: recharge.status,
      transactionalId: recharge.transactionalId,
      message: recharge.providerMessage,
      createdAt: recharge.createdAt,
      updatedAt: recharge.updatedAt,
    };
  }
}
