
import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';

import { ComaredAuthService } from './comared-auth.service';
import { ComaredSupplierResponseDto } from '../dtos/comared-supplier-response.dto';
import { ComaredBuyRequestDto } from '../dtos/comared-buy-request.dto';
import { ComaredBuyResponseDto } from '../dtos/comared-buy-response.dto';
import { ComaredRequestRejectedException } from '../exceptions/comared-request-rejected.exception';

@Injectable()
export class ComaredClientService {
  private readonly logger = new Logger(ComaredClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: ComaredAuthService,
  ) {}

  async getSuppliers(): Promise<ComaredSupplierResponseDto[]> {
    return this.requestWithAuth(
      (token) => this.fetchSuppliers(token),
      'No fue posible consultar los proveedores',
    );
  }

  async buy(body: ComaredBuyRequestDto): Promise<ComaredBuyResponseDto> {
    return this.requestWithAuth(
      (token) => this.postBuy(token, body),
      'No fue posible realizar la compra',
      true,
    );
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

  private async postBuy(
    token: string,
    body: ComaredBuyRequestDto,
  ): Promise<ComaredBuyResponseDto> {
    const response = await this.httpService.axiosRef.post<ComaredBuyResponseDto>(
      '/buy',
      body,
      {
        headers: {
          Authorization: token,
        },
      },
    );

    return response.data;
  }

  private async requestWithAuth<T>(
    operation: (token: string) => Promise<T>,
    errorMessage: string,
    treatClientErrorAsRejection = false,
  ): Promise<T> {
    const token = await this.authService.getToken();

    try {
      return await operation(token);
    } catch (error) {
      if (!this.isUnauthorized(error)) {
        this.handleError(error, errorMessage, treatClientErrorAsRejection);
      }

      this.logger.warn('Token de Comared rechazado. Renovando autenticación.');
      this.authService.invalidateToken(token);

      try {
        const newToken = await this.authService.getToken();
        return await operation(newToken);
      } catch (retryError) {
        this.handleError(
          retryError,
          errorMessage,
          treatClientErrorAsRejection,
        );
      }
    }
  }

  private isUnauthorized(error: unknown): boolean {
    return isAxiosError(error) && error.response?.status === 401;
  }

  private handleError(
    error: unknown,
    message: string,
    treatClientErrorAsRejection = false,
  ): never {
    if (isAxiosError(error)) {
      const status = error.response?.status;

      this.logger.error(
        `Error HTTP Comared: ${status ?? error.code ?? 'desconocido'}`,
      );

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new GatewayTimeoutException('PuntoRed no respondió a tiempo');
      }

      if (
        treatClientErrorAsRejection &&
        status &&
        status >= 400 &&
        status < 500 &&
        status !== 408
      ) {
        throw new ComaredRequestRejectedException(message);
      }
    } else {
      this.logger.error(`Error inesperado: ${message}`);
    }

    throw new BadGatewayException(message);
  }
  
}
