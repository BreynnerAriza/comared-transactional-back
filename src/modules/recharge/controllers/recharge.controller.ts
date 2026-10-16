import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiGatewayTimeoutResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Idempotent } from '@nestjs/idempotency';
import { RechargeService } from '../services/recharge.service';
import { RechargeBuyRequestDto } from '../dtos/recharge-buy-request.dto';
import { RechargeBuyResponseDto } from '../dtos/recharge-buy-response.dto';
import { CurrentUser } from '../../../common/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/dtos/authenticated-user.interface';
import { RechargeHistoryQueryDto } from '../dtos/recharge-history-query.dto';
import { RechargeHistoryResponseDto } from '../dtos/recharge-history-response.dto';
import { RechargeDetailResponseDto } from '../dtos/recharge-detail-response.dto';

@ApiTags('Recharge')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado' })
@Controller('recharge')
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Idempotent({
    required: true,
    ttl: '24h',
    storeIf: (status) => status < 500 || status === HttpStatus.BAD_GATEWAY,
  })
  @ApiOperation({ summary: 'Comprar una recarga' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Identificador único del intento de compra. Los reintentos con la misma clave devuelven la respuesta original.',
  })
  @ApiCreatedResponse({
    description: 'Recarga realizada correctamente',
    type: RechargeBuyResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos de la recarga inválidos' })
  @ApiNotFoundResponse({ description: 'El operador no existe en el catálogo' })
  @ApiUnprocessableEntityResponse({
    description: 'El proveedor rechazó la recarga o la clave de idempotencia se usó con otros datos',
  })
  @ApiBadGatewayResponse({
    description: 'No fue posible confirmar el resultado de la recarga con el proveedor',
  })
  @ApiGatewayTimeoutResponse({ description: 'El proveedor no respondió a tiempo' })
  @ApiConflictResponse({
    description: 'Ya hay una recarga en proceso con la misma clave de idempotencia',
  })
  async buy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: RechargeBuyRequestDto,
  ): Promise<RechargeBuyResponseDto> {
    return this.rechargeService.buy(user.id, request);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar el historial de recargas del usuario autenticado' })
  @ApiOkResponse({
    description: 'Historial de recargas paginado',
    type: RechargeHistoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RechargeHistoryQueryDto,
  ): Promise<RechargeHistoryResponseDto> {
    return this.rechargeService.getHistory(user.id, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar el detalle de una recarga del usuario autenticado' })
  @ApiParam({ name: 'id', description: 'Identificador (UUID) de la recarga', format: 'uuid' })
  @ApiOkResponse({
    description: 'Detalle de la recarga',
    type: RechargeDetailResponseDto,
  })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'La recarga no existe o no pertenece al usuario' })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RechargeDetailResponseDto> {
    return this.rechargeService.getById(user.id, id);
  }
  
}
