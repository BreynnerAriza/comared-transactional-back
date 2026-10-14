import {
  BadGatewayException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ComaredClientService } from '../../../integrations/comared/services/comared-client.service';
import { ComaredBuyResponseDto } from '../../../integrations/comared/dto/comared-buy-response.dto';
import { ComaredRequestRejectedException } from '../../../integrations/comared/exceptions/comared-request-rejected.exception';
import { SupplierService } from '../../supplier/services/supplier.service';

import { RechargeBuyRequestDto } from '../dto/recharge-buy-request.dto';
import { RechargeMapper } from '../mappers/recharge.mapper';
import { RechargeRepository } from '../repositories/recharge.repository';
import { RechargeBuyResponseDto } from '../dto/recharge-buy-response.dto';
import { RechargeHistoryQueryDto } from '../dto/recharge-history-query.dto';
import { RechargeHistoryResponseDto } from '../dto/recharge-history-response.dto';

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    private readonly comaredClientService: ComaredClientService,
    private readonly rechargeRepository: RechargeRepository,
    private readonly supplierService: SupplierService,
  ) {}

  async buy(
    userId: string,
    request: RechargeBuyRequestDto,
  ): Promise<RechargeBuyResponseDto> {
    const supplier = await this.supplierService.getById(request.supplierId);

    const recharge = await this.rechargeRepository.createPending(
      userId,
      supplier.id,
      supplier.name,
      request.cellPhone,
      request.value,
    );

    const response = await this.executePurchase(request, recharge.id);

    await this.rechargeRepository.markSuccess(
      recharge.id,
      response.transactionalID,
      response.message,
    );

    return RechargeMapper.toBuyResponse(recharge, response);
  }

  async getHistory(
    userId: string,
    query: RechargeHistoryQueryDto,
  ): Promise<RechargeHistoryResponseDto> {
    const { page, size } = query;

    const [recharges, total] = await this.rechargeRepository.findByUserId(
      userId,
      page,
      size,
    );

    return RechargeMapper.toHistoryResponse(recharges, total, page, size);
  }

  private async executePurchase(
    request: RechargeBuyRequestDto,
    rechargeId: string,
  ): Promise<ComaredBuyResponseDto> {
    const body = RechargeMapper.toComaredBuyRequest(request);

    let response: ComaredBuyResponseDto;

    try {
      response = await this.comaredClientService.buy(body);
    } catch (error) {
      if (error instanceof ComaredRequestRejectedException) {
        return this.handleFailedPurchase(rechargeId, error.message);
      }

      return this.handleUnknownPurchase(
        rechargeId,
        'No fue posible confirmar el resultado con el proveedor',
      );
    }

    if (!this.isValidResponse(response)) {
      return this.handleUnknownPurchase(
        rechargeId,
        'El proveedor devolvió una respuesta sin identificador transaccional',
      );
    }

    return response;
  }

  private isValidResponse(response: ComaredBuyResponseDto): boolean {
    return (
      !!response &&
      typeof response.transactionalID === 'string' &&
      !!response.transactionalID.trim()
    );
  }

  private async handleFailedPurchase(
    rechargeId: string,
    reason: string,
  ): Promise<never> {
    this.logger.error(`La recarga ${rechargeId} fue rechazada: ${reason}`);

    await this.rechargeRepository.markFailed(rechargeId, reason);

    throw new UnprocessableEntityException({
      message: 'El proveedor rechazó la recarga',
      rechargeId,
    });
  }

  private async handleUnknownPurchase(
    rechargeId: string,
    reason: string,
  ): Promise<never> {
    this.logger.error(
      `No se pudo confirmar la recarga ${rechargeId}: ${reason}`,
    );

    await this.rechargeRepository.markUnknown(rechargeId, reason);

    throw new BadGatewayException({
      message:
        'No fue posible confirmar el resultado de la recarga. Consulta su estado antes de volver a intentarlo.',
      rechargeId,
    });
  }
}
