import { ComaredSupplierResponseDto } from '../../../integrations/comared/dto/comared-supplier-response.dto';
import { SupplierDto } from '../dto/supplier.dto';

// Aísla el contrato público del contrato de Comared: si la API externa cambia
// o se agregan campos propios, solo se modifica este mapper.
export class SupplierMapper {
  static toDto(supplier: ComaredSupplierResponseDto): SupplierDto {
    return {
      id: supplier.id,
      name: supplier.name,
    };
  }
}
