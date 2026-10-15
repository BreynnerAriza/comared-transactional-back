import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import apiConfig from '../../../config/api.config';
import { ComaredAuthRequestDto } from '../dtos/comared-auth-request.dto';
import { ComaredAuthResponseDto } from '../dtos/comared-auth-response.dto';

@Injectable()
export class ComaredAuthService {

  private static readonly BEARER_TOKEN_REGEX = /^Bearer\s+\S+$/i;
  private readonly logger = new Logger(ComaredAuthService.name);
  private token: string | null = null;
  private authenticationPromise: Promise<string> | null = null;

  constructor(
    private readonly httpService: HttpService,
    @Inject(apiConfig.KEY)
    private readonly config: ConfigType<typeof apiConfig>,
  ) {}

  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    if (this.authenticationPromise) {
      return this.authenticationPromise;
    }

    const promise = this.authenticate();
    this.authenticationPromise = promise;

    try {
      return await promise;
    } finally {
      if (this.authenticationPromise === promise) {
        this.authenticationPromise = null;
      }
    }
  }

  invalidateToken(token?: string): void {
    if (token && this.token !== token) {
      return;
    }

    this.token = null;
  }

  private async authenticate(): Promise<string> {
    const body: ComaredAuthRequestDto = {
      user: this.config.username,
      password: this.config.password,
    };

    try {
      const response = await this.httpService.axiosRef.post<ComaredAuthResponseDto>(
          '/auth',
          body,
          {
            headers: {
              [this.config.keyName]: this.config.keyValue,
            },
          },
        );

      const token = response.data?.token;

      if (typeof token !== 'string' || !ComaredAuthService.BEARER_TOKEN_REGEX.test(token)) {
        throw new Error('Formato de token inválido en la respuesta de Comared');
      }

      this.token = token;
      this.logger.log('Autenticación con Comared exitosa');

      return token;

    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const code = isAxiosError(error) ? error.code : undefined;
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Error durante la autenticación con Comared (status=${status ?? 'N/A'}, code=${code ?? 'N/A'}): ${message}`,
      );

      throw new BadGatewayException('No fue posible autenticarse con Comared', {cause: error,});
    }
  }

}