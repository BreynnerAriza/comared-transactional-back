import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { ConfigType } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';

import { ComaredAuthService } from './comared-auth.service';
import apiConfig from '../../../config/api.config';

const config: ConfigType<typeof apiConfig> = {
  url: 'http://comared.test',
  username: 'usuario',
  password: 'clave',
  keyName: 'x-api-key',
  keyValue: 'api-key-valor',
};

const authResponse = (token: unknown) =>
  ({ data: { token } }) as AxiosResponse;

describe('ComaredAuthService', () => {
  const post = jest.fn<HttpService['axiosRef']['post']>();
  const httpService = { axiosRef: { post } } as unknown as HttpService;

  let service: ComaredAuthService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    service = new ComaredAuthService(httpService, config);
  });

  describe('getToken', () => {
    it('se autentica con las credenciales y el header de la API', async () => {
      post.mockResolvedValue(authResponse('Bearer abc'));

      await expect(service.getToken()).resolves.toBe('Bearer abc');
      expect(post).toHaveBeenCalledWith(
        '/auth',
        { user: 'usuario', password: 'clave' },
        { headers: { 'x-api-key': 'api-key-valor' } },
      );
    });

    it('reutiliza el token en caché en llamadas posteriores', async () => {
      post.mockResolvedValue(authResponse('Bearer abc'));

      await service.getToken();
      await service.getToken();

      expect(post).toHaveBeenCalledTimes(1);
    });

    it('comparte una sola autenticación entre llamadas concurrentes', async () => {
      post.mockResolvedValue(authResponse('Bearer abc'));

      const tokens = await Promise.all([
        service.getToken(),
        service.getToken(),
        service.getToken(),
      ]);

      expect(tokens).toEqual(['Bearer abc', 'Bearer abc', 'Bearer abc']);
      expect(post).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['sin prefijo Bearer', 'abc'],
      ['solo el prefijo', 'Bearer '],
      ['ausente', undefined],
      ['no string', 123],
    ])('lanza BadGatewayException si el token es %s', async (_name, token) => {
      post.mockResolvedValue(authResponse(token));

      await expect(service.getToken()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('lanza BadGatewayException si Comared responde con error HTTP', async () => {
      post.mockRejectedValue(
        new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
          status: 401,
        } as AxiosResponse),
      );

      await expect(service.getToken()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('vuelve a intentar la autenticación después de un fallo', async () => {
      post
        .mockRejectedValueOnce(new Error('caída'))
        .mockResolvedValueOnce(authResponse('Bearer abc'));

      await expect(service.getToken()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      await expect(service.getToken()).resolves.toBe('Bearer abc');
      expect(post).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateToken', () => {
    beforeEach(async () => {
      post.mockResolvedValue(authResponse('Bearer abc'));
      await service.getToken();
      post.mockClear();
    });

    it('sin argumento descarta el token y fuerza una nueva autenticación', async () => {
      service.invalidateToken();
      await service.getToken();

      expect(post).toHaveBeenCalledTimes(1);
    });

    it('con el token actual lo descarta', async () => {
      service.invalidateToken('Bearer abc');
      await service.getToken();

      expect(post).toHaveBeenCalledTimes(1);
    });

    it('con un token distinto conserva el actual', async () => {
      service.invalidateToken('Bearer viejo');
      await service.getToken();

      expect(post).not.toHaveBeenCalled();
    });
  });
});
