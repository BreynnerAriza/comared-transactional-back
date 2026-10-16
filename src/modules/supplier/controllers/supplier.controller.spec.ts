import { describe, it, expect, jest } from '@jest/globals';

import { SupplierController } from './supplier.controller';
import { SupplierService } from '../services/supplier.service';

describe('SupplierController', () => {
  it('getSuppliers devuelve los operadores del servicio', async () => {
    const suppliers = [{ id: 'claro', name: 'Claro' }];
    const supplierService = {
      getSuppliers: jest.fn<SupplierService['getSuppliers']>(),
    };
    supplierService.getSuppliers.mockResolvedValue(suppliers);

    const controller = new SupplierController(
      supplierService as unknown as SupplierService,
    );

    await expect(controller.getSuppliers()).resolves.toBe(suppliers);
    expect(supplierService.getSuppliers).toHaveBeenCalledTimes(1);
  });
});
