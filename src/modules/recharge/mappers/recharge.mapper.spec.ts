import { describe, it, expect } from '@jest/globals';

import { RechargeMapper } from './recharge.mapper';
import { RechargeEntity } from '../entities/recharge.entity';
import { RechargeStatus } from '../enums/recharge-status.enum';

const buildRecharge = (overrides: Partial<RechargeEntity> = {}): RechargeEntity =>
  Object.assign(new RechargeEntity(), {
    id: 'r1',
    userId: 'u1',
    supplierId: 'claro',
    supplierName: 'Claro',
    cellPhone: '3001234567',
    amount: 5000,
    status: RechargeStatus.SUCCESS,
    transactionalId: 'tx-1',
    providerMessage: 'OK',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  });

describe('RechargeMapper', () => {
  describe('toComaredBuyRequest', () => {
    it('envía solo supplierId, cellPhone y value al proveedor', () => {
      const result = RechargeMapper.toComaredBuyRequest({
        supplierId: 'claro',
        supplierName: 'Claro',
        cellPhone: '3001234567',
        value: 5000,
      });

      expect(result).toStrictEqual({
        supplierId: 'claro',
        cellPhone: '3001234567',
        value: 5000,
      });
    });
  });

  describe('toBuyResponse', () => {
    it('combina el id de la recarga con los datos del proveedor', () => {
      const result = RechargeMapper.toBuyResponse(buildRecharge(), {
        transactionalID: 'tx-1',
        message: 'Recarga exitosa',
        cellPhone: '3001234567',
        value: 5000,
      });

      expect(result).toStrictEqual({
        rechargeId: 'r1',
        transactionalID: 'tx-1',
        message: 'Recarga exitosa',
        cellPhone: '3001234567',
        value: 5000,
        supplierName: 'Claro',
      });
    });
  });

  describe('toHistoryItem', () => {
    it('no expone userId, supplierId ni updatedAt', () => {
      const result = RechargeMapper.toHistoryItem(buildRecharge());

      expect(result).toStrictEqual({
        id: 'r1',
        supplierName: 'Claro',
        cellPhone: '3001234567',
        amount: 5000,
        status: RechargeStatus.SUCCESS,
        transactionalId: 'tx-1',
        providerMessage: 'OK',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
    });
  });

  describe('toDetailResponse', () => {
    it('incluye supplierId y updatedAt pero no userId', () => {
      const result = RechargeMapper.toDetailResponse(
        buildRecharge({ transactionalId: null, providerMessage: null }),
      );

      expect(result).toStrictEqual({
        id: 'r1',
        supplierId: 'claro',
        supplierName: 'Claro',
        cellPhone: '3001234567',
        amount: 5000,
        status: RechargeStatus.SUCCESS,
        transactionalId: null,
        providerMessage: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      });
    });
  });

  describe('toHistoryResponse', () => {
    it('mapea cada recarga del listado', () => {
      const result = RechargeMapper.toHistoryResponse(
        [buildRecharge({ id: 'r1' }), buildRecharge({ id: 'r2' })],
        2,
        1,
        10,
      );

      expect(result.data.map((item) => item.id)).toEqual(['r1', 'r2']);
    });

    it.each([
      { total: 0, size: 10, totalPages: 0 },
      { total: 10, size: 10, totalPages: 1 },
      { total: 11, size: 10, totalPages: 2 },
      { total: 25, size: 5, totalPages: 5 },
    ])(
      'calcula $totalPages páginas para $total elementos de a $size',
      ({ total, size, totalPages }) => {
        const result = RechargeMapper.toHistoryResponse([], total, 2, size);

        expect(result.pagination).toStrictEqual({
          page: 2,
          size,
          totalElements: total,
          totalPages,
        });
      },
    );
  });
});
