import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { RechargeController } from './recharge.controller';
import { RechargeService } from '../services/recharge.service';
import { RechargeBuyResponseDto } from '../dtos/recharge-buy-response.dto';
import { RechargeHistoryResponseDto } from '../dtos/recharge-history-response.dto';
import { RechargeDetailResponseDto } from '../dtos/recharge-detail-response.dto';

describe('RechargeController', () => {
  const rechargeService = {
    buy: jest.fn<RechargeService['buy']>(),
    getHistory: jest.fn<RechargeService['getHistory']>(),
    getById: jest.fn<RechargeService['getById']>(),
  };

  const user = { id: 'u1', name: 'Ana', email: 'ana@correo.com' };

  let controller: RechargeController;

  beforeEach(() => {
    controller = new RechargeController(
      rechargeService as unknown as RechargeService,
    );
  });

  it('buy delega en el servicio con el id del usuario autenticado', async () => {
    const request = { supplierId: 'claro', cellPhone: '3001234567', value: 5000 };
    const response = { rechargeId: 'r1' } as RechargeBuyResponseDto;
    rechargeService.buy.mockResolvedValue(response);

    await expect(controller.buy(user, request)).resolves.toBe(response);
    expect(rechargeService.buy).toHaveBeenCalledWith('u1', request);
  });

  it('getHistory delega en el servicio con el id del usuario autenticado', async () => {
    const query = { page: 1, size: 10 };
    const response = { data: [] } as unknown as RechargeHistoryResponseDto;
    rechargeService.getHistory.mockResolvedValue(response);

    await expect(controller.getHistory(user, query)).resolves.toBe(response);
    expect(rechargeService.getHistory).toHaveBeenCalledWith('u1', query);
  });

  it('getById delega en el servicio con el id del usuario autenticado', async () => {
    const response = { id: 'r1' } as RechargeDetailResponseDto;
    rechargeService.getById.mockResolvedValue(response);

    await expect(controller.getById(user, 'r1')).resolves.toBe(response);
    expect(rechargeService.getById).toHaveBeenCalledWith('u1', 'r1');
  });
});
