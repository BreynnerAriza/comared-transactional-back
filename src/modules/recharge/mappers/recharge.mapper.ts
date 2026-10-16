import { ComaredBuyRequestDto } from '../../../integrations/comared/dtos/comared-buy-request.dto';
import { ComaredBuyResponseDto } from '../../../integrations/comared/dtos/comared-buy-response.dto';
import { RechargeBuyRequestDto } from '../dtos/recharge-buy-request.dto';
import { RechargeHistoryItemDto } from '../dtos/recharge-history-item.dto';
import { RechargeHistoryResponseDto } from '../dtos/recharge-history-response.dto';
import { RechargeEntity } from '../entities/recharge.entity';
import { RechargeBuyResponseDto } from '../dtos/recharge-buy-response.dto';
import { RechargeDetailResponseDto } from '../dtos/recharge-detail-response.dto';

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
  ): RechargeBuyResponseDto {
    return {
      rechargeId: recharge.id,
      transactionalID: response.transactionalID,
      message: response.message,
      cellPhone: response.cellPhone,
      value: response.value,
      supplierName: recharge.supplierName,
    };
  }

  static toHistoryItem(recharge: RechargeEntity): RechargeHistoryItemDto {
    return {
      id: recharge.id,
      supplierName: recharge.supplierName,
      cellPhone: recharge.cellPhone,
      amount: recharge.amount,
      status: recharge.status,
      transactionalId: recharge.transactionalId,
      providerMessage: recharge.providerMessage,
      createdAt: recharge.createdAt,
    };
  }

  static toDetailResponse(recharge: RechargeEntity): RechargeDetailResponseDto {
    return {
      id: recharge.id,
      supplierId: recharge.supplierId,
      supplierName: recharge.supplierName,
      cellPhone: recharge.cellPhone,
      amount: recharge.amount,
      status: recharge.status,
      transactionalId: recharge.transactionalId,
      providerMessage: recharge.providerMessage,
      createdAt: recharge.createdAt,
      updatedAt: recharge.updatedAt,
    };
  }

  static toHistoryResponse(
    recharges: RechargeEntity[],
    total: number,
    page: number,
    size: number,
  ): RechargeHistoryResponseDto {
    return {
      data: recharges.map((recharge) => RechargeMapper.toHistoryItem(recharge)),
      pagination: {
        page,
        size,
        totalElements: total,
        totalPages: Math.ceil(total / size),
      },
    };
  }
}
