import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';

import { ComaredAuthService } from './comared-auth.service';
import { ComaredSupplierResponseDto } from '../dto/comared-supplier-response.dto';

@Injectable()
export class ComaredClientService {

  private readonly logger = new Logger(ComaredClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: ComaredAuthService,
  ) {}

  async getSuppliers(): Promise<ComaredSupplierResponseDto[]> {
    const token = await this.authService.getToken();

    try {
      return await this.fetchSuppliers(token);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        this.logger.warn(
          'Token de Comared rechazado. Renovando autenticación.',
        );

        this.authService.invalidateToken(token);

        const newToken = await this.authService.getToken();

        try {
          return await this.fetchSuppliers(newToken);
        } catch (retryError) {
          this.handleError(retryError);
        }
      }

      this.handleError(error);
    }
  }

  private async fetchSuppliers(
    token: string,
  ): Promise<ComaredSupplierResponseDto[]> {
    const response = await this.httpService.axiosRef.get<
      ComaredSupplierResponseDto[]
    >('/getSuppliers', {
      headers: {
        Authorization: token,
      },
    });

    return response.data;
  }

  private handleError(error: unknown): never {
    if (isAxiosError(error)) {
      this.logger.error(
        `Error HTTP Comared: ${error.response?.status ?? error.code ?? 'desconocido'}`,
      );

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new GatewayTimeoutException('PuntoRed no respondió a tiempo');
      }
    } else {
      this.logger.error('Error inesperado consultando proveedores');
    }

    throw new BadGatewayException('No fue posible consultar los proveedores');
  }

}