import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiGatewayTimeoutResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupplierService } from '../services/supplier.service';
import { SupplierDto } from '../dtos/supplier.dto';

@ApiTags('Supplier')
@ApiBearerAuth('access-token')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar los operadores disponibles para recargas' })
  @ApiOkResponse({
    description: 'Catálogo de operadores',
    type: SupplierDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado' })
  @ApiBadGatewayResponse({ description: 'No fue posible consultar el proveedor' })
  @ApiGatewayTimeoutResponse({ description: 'El proveedor no respondió a tiempo' })
  @ApiServiceUnavailableResponse({ description: 'No fue posible autenticarse con el proveedor' })
  async getSuppliers(): Promise<SupplierDto[]> {
    return this.supplierService.getSuppliers();
  }

}
