import { Injectable, NotFoundException } from '@nestjs/common';
import { ComaredClientService } from '../../../integrations/comared/services/comared-client.service';
import { SupplierDto } from '../dtos/supplier.dto';
import { SupplierMapper } from '../mappers/supplier.mapper';

@Injectable()
export class SupplierService {
  constructor(private readonly comaredClientService: ComaredClientService) {}

  async getSuppliers(): Promise<SupplierDto[]> {
    const suppliers = await this.comaredClientService.getSuppliers();

    return suppliers.map((supplier) => SupplierMapper.toDto(supplier));
  }

  async getById(id: string): Promise<SupplierDto> {
    const suppliers = await this.getSuppliers();
    const supplier = suppliers.find((item) => item.id === id);

    if (!supplier) {
      throw new NotFoundException('El operador no existe en el catálogo');
    }

    return supplier;
  }
  
}
