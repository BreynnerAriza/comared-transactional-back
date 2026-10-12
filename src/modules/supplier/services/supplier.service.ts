import { Injectable } from '@nestjs/common';
import { ComaredClientService } from '../../../integrations/comared/services/comared-client.service';
import { SupplierDto } from '../dto/supplier.dto';
import { SupplierMapper } from '../mappers/supplier.mapper';

@Injectable()
export class SupplierService {
  constructor(private readonly comaredClientService: ComaredClientService) {}

  // Obtener los proveedores de red móvil
  async getSuppliers(): Promise<SupplierDto[]> {
    const suppliers = await this.comaredClientService.getSuppliers();

    return suppliers.map(SupplierMapper.toDto);
  }
}
