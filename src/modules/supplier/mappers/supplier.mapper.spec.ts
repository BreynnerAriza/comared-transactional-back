import { describe, it, expect } from '@jest/globals';

import { SupplierMapper } from './supplier.mapper';
import { ComaredSupplierResponseDto } from '../../../integrations/comared/dtos/comared-supplier-response.dto';

describe('SupplierMapper', () => {
  it('conserva solo id y nombre del operador', () => {
    const supplier = {
      id: 'claro',
      name: 'Claro',
      extra: 'no debe salir',
    } as ComaredSupplierResponseDto;

    expect(SupplierMapper.toDto(supplier)).toStrictEqual({
      id: 'claro',
      name: 'Claro',
    });
  });
});
