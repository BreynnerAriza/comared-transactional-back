import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RechargeBuyRequestDto } from './recharge-buy-request.dto';
import { RechargeHistoryQueryDto } from './recharge-history-query.dto';

const invalidFields = async <T extends object>(
  dto: new () => T,
  plain: object,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(dto, plain));
  return errors.map((error) => error.property);
};

describe('RechargeBuyRequestDto', () => {
  const valid = { supplierId: 'claro', cellPhone: '3001234567', value: 5000 };

  it('acepta una solicitud válida', async () => {
    await expect(invalidFields(RechargeBuyRequestDto, valid)).resolves.toEqual([]);
  });

  it('acepta supplierName opcional', async () => {
    await expect(
      invalidFields(RechargeBuyRequestDto, { ...valid, supplierName: 'Claro' }),
    ).resolves.toEqual([]);
  });

  it.each([
    [1000, true],
    [100000, true],
    [999, false],
    [100001, false],
    ['5000', false],
  ])('value=%p es válido: %p', async (value, isValid) => {
    const fields = await invalidFields(RechargeBuyRequestDto, { ...valid, value });

    expect(fields.includes('value')).toBe(!isValid);
  });

  it.each([
    ['3001234567', true],
    ['2001234567', false],
    ['300123456', false],
    ['30012345678', false],
    ['300123456a', false],
    [3001234567, false],
  ])('cellPhone=%p es válido: %p', async (cellPhone, isValid) => {
    const fields = await invalidFields(RechargeBuyRequestDto, {
      ...valid,
      cellPhone,
    });

    expect(fields.includes('cellPhone')).toBe(!isValid);
  });

  it.each([[''], [undefined], [123]])(
    'rechaza supplierId=%p',
    async (supplierId) => {
      await expect(
        invalidFields(RechargeBuyRequestDto, { ...valid, supplierId }),
      ).resolves.toContain('supplierId');
    },
  );
});

describe('RechargeHistoryQueryDto', () => {
  it('usa page=1 y size=10 por defecto', async () => {
    const query = plainToInstance(RechargeHistoryQueryDto, {});

    expect(query.page).toBe(1);
    expect(query.size).toBe(10);
    await expect(validate(query)).resolves.toEqual([]);
  });

  it('convierte los query params de texto a número', async () => {
    const query = plainToInstance(RechargeHistoryQueryDto, {
      page: '3',
      size: '20',
    });

    expect(query.page).toBe(3);
    expect(query.size).toBe(20);
    await expect(validate(query)).resolves.toEqual([]);
  });

  it.each([
    [{ page: '0' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ page: 'abc' }, 'page'],
    [{ size: '0' }, 'size'],
    [{ size: '101' }, 'size'],
  ])('rechaza %p', async (plain, field) => {
    await expect(invalidFields(RechargeHistoryQueryDto, plain)).resolves.toContain(
      field,
    );
  });

  it('acepta size=100', async () => {
    await expect(
      invalidFields(RechargeHistoryQueryDto, { size: '100' }),
    ).resolves.toEqual([]);
  });
});
