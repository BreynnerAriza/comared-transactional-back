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
import { ComaredAuthRequestDto } from '../dto/comared-auth-request.dto';
import { ComaredAuthResponseDto } from '../dto/comared-auth-response.dto';

@Injectable()
export class ComaredAuthService {

  private static readonly BEARER_TOKEN_REGEX = /^Bearer\s+\S+$/i;
  private readonly logger = new Logger(ComaredAuthService.name);
  private token: string | null = null;

  // Autenticación en curso compartida: si varias peticiones piden token a la
  // vez, todas esperan esta misma promesa y solo se hace un POST /auth.
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
      // Se libera tanto en éxito como en error, para que un fallo no deje
      // bloqueados los intentos posteriores.
      if (this.authenticationPromise === promise) {
        this.authenticationPromise = null;
      }
    }
  }

  /**
   * Descarta el token en caché (p. ej. tras recibir un 401).
   * Si se pasa el token que falló, solo se invalida cuando coincide con el
   * actual; así una petición antigua no borra un token recién renovado.
   */
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
      // No se registra el error completo: un AxiosError incluye config.headers
      // (API key) y config.data (password). Solo se registran datos seguros.
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