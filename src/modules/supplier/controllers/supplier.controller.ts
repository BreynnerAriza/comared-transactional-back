import { Controller, Get } from '@nestjs/common';
import { SupplierService } from '../services/supplier.service';
import { SupplierDto } from '../dto/supplier.dto';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  async getSuppliers(): Promise<SupplierDto[]> {
    return this.supplierService.getSuppliers();
  }
  
}
