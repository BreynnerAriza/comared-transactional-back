import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  BadGatewayException,
  ConflictException,
  GatewayTimeoutException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { RechargeService } from './recharge.service';
import { RechargeRepository } from '../repositories/recharge.repository';
import { RechargeEntity } from '../entities/recharge.entity';
import { RechargeStatus } from '../enums/recharge-status.enum';
import { RechargeBuyRequestDto } from '../dtos/recharge-buy-request.dto';
import { ComaredClientService } from '../../../integrations/comared/services/comared-client.service';
import { ComaredBuyResponseDto } from '../../../integrations/comared/dtos/comared-buy-response.dto';
import { ComaredRequestRejectedException } from '../../../integrations/comared/exceptions/comared-request-rejected.exception';
import { ComaredUnavailableException } from '../../../integrations/comared/exceptions/comared-unavailable.exception';
import { SupplierService } from '../../supplier/services/supplier.service';

describe('RechargeService', () => {
  const rechargeRepository = {
    createPending: jest.fn<RechargeRepository['createPending']>(),
    markSuccess: jest.fn<RechargeRepository['markSuccess']>(),
    markFailed: jest.fn<RechargeRepository['markFailed']>(),
    markUnknown: jest.fn<RechargeRepository['markUnknown']>(),
    findByUserId: jest.fn<RechargeRepository['findByUserId']>(),
    findByIdAndUserId: jest.fn<RechargeRepository['findByIdAndUserId']>(),
  };
  const comaredClientService = {
    buy: jest.fn<ComaredClientService['buy']>(),
  };
  const supplierService = {
    getById: jest.fn<SupplierService['getById']>(),
  };

  const request: RechargeBuyRequestDto = {
    supplierId: 'claro',
    cellPhone: '3001234567',
    value: 5000,
  };

  const pendingRecharge = Object.assign(new RechargeEntity(), {
    id: 'r1',
    userId: 'u1',
    supplierId: 'claro',
    supplierName: 'Claro',
    cellPhone: '3001234567',
    amount: 5000,
    status: RechargeStatus.PENDING,
    transactionalId: null,
    providerMessage: null,
  });

  const comaredResponse: ComaredBuyResponseDto = {
    transactionalID: 'tx-1',
    message: 'Recarga exitosa',
    cellPhone: '3001234567',
    value: 5000,
  };

  let service: RechargeService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    service = new RechargeService(
      comaredClientService as unknown as ComaredClientService,
      rechargeRepository as unknown as RechargeRepository,
      supplierService as unknown as SupplierService,
    );

    supplierService.getById.mockResolvedValue({ id: 'claro', name: 'Claro' });
    rechargeRepository.createPending.mockResolvedValue(pendingRecharge);
    rechargeRepository.markSuccess.mockResolvedValue(true);
    rechargeRepository.markFailed.mockResolvedValue(true);
    rechargeRepository.markUnknown.mockResolvedValue(true);
  });

  describe('buy', () => {
    it('registra la recarga como pendiente, compra y la marca exitosa', async () => {
      comaredClientService.buy.mockResolvedValue(comaredResponse);

      const result = await service.buy('u1', request);

      expect(supplierService.getById).toHaveBeenCalledWith('claro');
      expect(rechargeRepository.createPending).toHaveBeenCalledWith(
        'u1',
        'claro',
        'Claro',
        '3001234567',
        5000,
      );
      expect(comaredClientService.buy).toHaveBeenCalledWith({
        supplierId: 'claro',
        cellPhone: '3001234567',
        value: 5000,
      });
      expect(rechargeRepository.markSuccess).toHaveBeenCalledWith(
        'r1',
        'tx-1',
        'Recarga exitosa',
      );
      expect(result).toStrictEqual({
        rechargeId: 'r1',
        transactionalID: 'tx-1',
        message: 'Recarga exitosa',
        cellPhone: '3001234567',
        value: 5000,
        supplierName: 'Claro',
      });
    });

    it('crea la recarga antes de llamar al proveedor', async () => {
      comaredClientService.buy.mockResolvedValue(comaredResponse);

      await service.buy('u1', request);

      const createOrder =
        rechargeRepository.createPending.mock.invocationCallOrder[0];
      const buyOrder = comaredClientService.buy.mock.invocationCallOrder[0];
      expect(createOrder).toBeLessThan(buyOrder);
    });

    it('no crea la recarga si el operador no existe', async () => {
      supplierService.getById.mockRejectedValue(
        new NotFoundException('El operador no existe en el catálogo'),
      );

      await expect(service.buy('u1', request)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(rechargeRepository.createPending).not.toHaveBeenCalled();
      expect(comaredClientService.buy).not.toHaveBeenCalled();
    });

    it('marca FAILED y lanza 422 cuando el proveedor rechaza la recarga', async () => {
      comaredClientService.buy.mockRejectedValue(
        new ComaredRequestRejectedException('Saldo insuficiente'),
      );

      await expect(service.buy('u1', request)).rejects.toMatchObject({
        constructor: UnprocessableEntityException,
        response: { message: 'El proveedor rechazó la recarga', rechargeId: 'r1' },
      });
      expect(rechargeRepository.markFailed).toHaveBeenCalledWith(
        'r1',
        'Saldo insuficiente',
      );
      expect(rechargeRepository.markSuccess).not.toHaveBeenCalled();
      expect(rechargeRepository.markUnknown).not.toHaveBeenCalled();
    });

    it('marca FAILED y lanza 503 cuando no se pudo autenticar con el proveedor', async () => {
      comaredClientService.buy.mockRejectedValue(
        new ComaredUnavailableException(),
      );

      await expect(service.buy('u1', request)).rejects.toMatchObject({
        constructor: ServiceUnavailableException,
        response: {
          message:
            'El servicio de recargas no está disponible en este momento. Intenta de nuevo más tarde.',
          rechargeId: 'r1',
        },
      });
      expect(rechargeRepository.markFailed).toHaveBeenCalledWith(
        'r1',
        'No fue posible autenticarse con Comared',
      );
      expect(rechargeRepository.markUnknown).not.toHaveBeenCalled();
      expect(rechargeRepository.markSuccess).not.toHaveBeenCalled();
    });

    it.each([
      ['BadGatewayException', new BadGatewayException('falla')],
      ['GatewayTimeoutException', new GatewayTimeoutException('timeout')],
      ['Error genérico', new Error('inesperado')],
    ])(
      'marca UNKNOWN y lanza 502 cuando el proveedor falla con %s',
      async (_name, error) => {
        comaredClientService.buy.mockRejectedValue(error);

        await expect(service.buy('u1', request)).rejects.toMatchObject({
          constructor: BadGatewayException,
          response: { rechargeId: 'r1' },
        });
        expect(rechargeRepository.markUnknown).toHaveBeenCalledWith(
          'r1',
          'No fue posible confirmar el resultado con el proveedor',
        );
        expect(rechargeRepository.markFailed).not.toHaveBeenCalled();
        expect(rechargeRepository.markSuccess).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['undefined', undefined],
      ['vacío', ''],
      ['solo espacios', '   '],
      ['no string', 123],
    ])(
      'marca UNKNOWN si el transactionalID es %s',
      async (_name, transactionalID) => {
        comaredClientService.buy.mockResolvedValue({
          transactionalID,
          message: 'Recarga exitosa',
          cellPhone: '3001234567',
          value: 5000,
        } as unknown as ComaredBuyResponseDto);

        await expect(service.buy('u1', request)).rejects.toBeInstanceOf(
          BadGatewayException,
        );
        expect(rechargeRepository.markUnknown).toHaveBeenCalledWith(
          'r1',
          'El proveedor devolvió una respuesta sin identificador transaccional',
        );
        expect(rechargeRepository.markSuccess).not.toHaveBeenCalled();
      },
    );

    it('marca UNKNOWN si el proveedor responde sin cuerpo', async () => {
      comaredClientService.buy.mockResolvedValue(
        null as unknown as ComaredBuyResponseDto,
      );

      await expect(service.buy('u1', request)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      expect(rechargeRepository.markUnknown).toHaveBeenCalled();
    });

    it('lanza ConflictException si la recarga ya no estaba pendiente', async () => {
      comaredClientService.buy.mockResolvedValue(comaredResponse);
      rechargeRepository.markSuccess.mockResolvedValue(false);

      await expect(service.buy('u1', request)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('getHistory', () => {
    it('consulta las recargas del usuario con la paginación recibida', async () => {
      rechargeRepository.findByUserId.mockResolvedValue([[pendingRecharge], 21]);

      const result = await service.getHistory('u1', { page: 2, size: 10 });

      expect(rechargeRepository.findByUserId).toHaveBeenCalledWith('u1', 2, 10);
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toStrictEqual({
        page: 2,
        size: 10,
        totalElements: 21,
        totalPages: 3,
      });
    });
  });

  describe('getById', () => {
    it('busca la recarga filtrando por el usuario autenticado', async () => {
      rechargeRepository.findByIdAndUserId.mockResolvedValue(pendingRecharge);

      const result = await service.getById('u1', 'r1');

      expect(rechargeRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'r1',
        'u1',
      );
      expect(result.id).toBe('r1');
    });

    it('lanza NotFoundException si la recarga no existe o es de otro usuario', async () => {
      rechargeRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getById('u1', 'r1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
