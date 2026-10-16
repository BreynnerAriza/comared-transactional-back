import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadGatewayException, NotFoundException } from '@nestjs/common';

import { SupplierService } from './supplier.service';
import { ComaredClientService } from '../../../integrations/comared/services/comared-client.service';

describe('SupplierService', () => {
  const comaredClientService = {
    getSuppliers: jest.fn<ComaredClientService['getSuppliers']>(),
  };

  const suppliers = [
    { id: 'claro', name: 'Claro' },
    { id: 'movistar', name: 'Movistar' },
  ];

  let service: SupplierService;

  beforeEach(() => {
    service = new SupplierService(
      comaredClientService as unknown as ComaredClientService,
    );
  });

  describe('getSuppliers', () => {
    it('devuelve los operadores del proveedor mapeados', async () => {
      comaredClientService.getSuppliers.mockResolvedValue(suppliers);

      await expect(service.getSuppliers()).resolves.toStrictEqual(suppliers);
      expect(comaredClientService.getSuppliers).toHaveBeenCalledTimes(1);
    });

    it('devuelve un arreglo vacío si no hay operadores', async () => {
      comaredClientService.getSuppliers.mockResolvedValue([]);

      await expect(service.getSuppliers()).resolves.toEqual([]);
    });

    it('propaga el error del cliente de Comared', async () => {
      comaredClientService.getSuppliers.mockRejectedValue(
        new BadGatewayException('falla'),
      );

      await expect(service.getSuppliers()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('getById', () => {
    it('devuelve el operador si existe en el catálogo', async () => {
      comaredClientService.getSuppliers.mockResolvedValue(suppliers);

      await expect(service.getById('movistar')).resolves.toStrictEqual({
        id: 'movistar',
        name: 'Movistar',
      });
    });

    it('lanza NotFoundException si el operador no existe', async () => {
      comaredClientService.getSuppliers.mockResolvedValue(suppliers);

      await expect(service.getById('desconocido')).rejects.toThrow(
        new NotFoundException('El operador no existe en el catálogo'),
      );
    });
  });
});
