import { ComaredSupplierResponseDto } from '../../../integrations/comared/dtos/comared-supplier-response.dto';
import { SupplierDto } from '../dtos/supplier.dto';

export class SupplierMapper {
  static toDto(supplier: ComaredSupplierResponseDto): SupplierDto {
    return {
      id: supplier.id,
      name: supplier.name,
    };
  }
}
