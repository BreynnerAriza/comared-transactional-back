import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  BadGatewayException,
  GatewayTimeoutException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';

import { ComaredClientService } from './comared-client.service';
import { ComaredAuthService } from './comared-auth.service';
import { ComaredRequestRejectedException } from '../exceptions/comared-request-rejected.exception';
import { ComaredUnavailableException } from '../exceptions/comared-unavailable.exception';
import { ComaredBuyRequestDto } from '../dtos/comared-buy-request.dto';

const axiosError = (status?: number, code?: string) =>
  new AxiosError(
    'error',
    code,
    undefined,
    undefined,
    status ? ({ status } as AxiosResponse) : undefined,
  );

const ok = (data: unknown) => ({ data }) as AxiosResponse;

describe('ComaredClientService', () => {
  const get = jest.fn<HttpService['axiosRef']['get']>();
  const post = jest.fn<HttpService['axiosRef']['post']>();
  const httpService = { axiosRef: { get, post } } as unknown as HttpService;

  const authService = {
    getToken: jest.fn<ComaredAuthService['getToken']>(),
    invalidateToken: jest.fn<ComaredAuthService['invalidateToken']>(),
  };

  const buyBody: ComaredBuyRequestDto = {
    supplierId: 'claro',
    cellPhone: '3001234567',
    value: 5000,
  };

  const buyResponse = {
    transactionalID: 'tx-1',
    message: 'Recarga exitosa',
    cellPhone: '3001234567',
    value: 5000,
  };

  let service: ComaredClientService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    service = new ComaredClientService(
      httpService,
      authService as unknown as ComaredAuthService,
    );

    authService.getToken.mockResolvedValue('Bearer t1');
  });

  describe('getSuppliers', () => {
    it('consulta los operadores con el token de autorización', async () => {
      const suppliers = [{ id: 'claro', name: 'Claro' }];
      get.mockResolvedValue(ok(suppliers));

      await expect(service.getSuppliers()).resolves.toBe(suppliers);
      expect(get).toHaveBeenCalledWith('/getSuppliers', {
        headers: { Authorization: 'Bearer t1' },
      });
    });

    it('lanza BadGatewayException ante un 4xx (no es un rechazo de compra)', async () => {
      get.mockRejectedValue(axiosError(400));

      await expect(service.getSuppliers()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('buy', () => {
    it('envía la compra con el token de autorización', async () => {
      post.mockResolvedValue(ok(buyResponse));

      await expect(service.buy(buyBody)).resolves.toBe(buyResponse);
      expect(post).toHaveBeenCalledWith('/buy', buyBody, {
        headers: { Authorization: 'Bearer t1' },
      });
    });

    it.each([400, 404, 422])(
      'lanza ComaredRequestRejectedException ante un %i',
      async (status) => {
        post.mockRejectedValue(axiosError(status));

        await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
          ComaredRequestRejectedException,
        );
      },
    );

    it('trata el 408 como error de comunicación y no como rechazo', async () => {
      post.mockRejectedValue(axiosError(408));

      await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it.each([500, 503])('lanza BadGatewayException ante un %i', async (status) => {
      post.mockRejectedValue(axiosError(status));

      await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it.each(['ECONNABORTED', 'ETIMEDOUT'])(
      'lanza GatewayTimeoutException ante %s',
      async (code) => {
        post.mockRejectedValue(axiosError(undefined, code));

        await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
          GatewayTimeoutException,
        );
      },
    );

    it('lanza BadGatewayException ante un error que no es de axios', async () => {
      post.mockRejectedValue(new Error('inesperado'));

      await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('renovación del token ante un 401', () => {
    it('invalida el token, obtiene uno nuevo y reintenta una vez', async () => {
      authService.getToken
        .mockResolvedValueOnce('Bearer t1')
        .mockResolvedValueOnce('Bearer t2');
      post
        .mockRejectedValueOnce(axiosError(401))
        .mockResolvedValueOnce(ok(buyResponse));

      await expect(service.buy(buyBody)).resolves.toBe(buyResponse);
      expect(authService.invalidateToken).toHaveBeenCalledWith('Bearer t1');
      expect(post).toHaveBeenCalledTimes(2);
      expect(post).toHaveBeenLastCalledWith('/buy', buyBody, {
        headers: { Authorization: 'Bearer t2' },
      });
    });

    it('lanza ComaredUnavailableException (no un rechazo) si el nuevo token también recibe 401', async () => {
      post.mockRejectedValue(axiosError(401));

      const error = await service.buy(buyBody).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ComaredUnavailableException);
      expect(error).not.toBeInstanceOf(ComaredRequestRejectedException);
      expect(post).toHaveBeenCalledTimes(2);
    });

    it('en getSuppliers un 401 persistente responde 503', async () => {
      get.mockRejectedValue(axiosError(401));

      await expect(service.getSuppliers()).rejects.toMatchObject({
        constructor: ComaredUnavailableException,
        status: 503,
      });
      expect(get).toHaveBeenCalledTimes(2);
    });

    it('lanza ComaredUnavailableException si no logra renovar el token', async () => {
      const authError = new BadGatewayException('auth caída');
      authService.getToken
        .mockResolvedValueOnce('Bearer t1')
        .mockRejectedValueOnce(authError);
      post.mockRejectedValue(axiosError(401));

      await expect(service.buy(buyBody)).rejects.toMatchObject({
        constructor: ComaredUnavailableException,
        cause: authError,
      });
      expect(post).toHaveBeenCalledTimes(1);
    });

    it('clasifica normalmente un error distinto de 401 en el reintento', async () => {
      post
        .mockRejectedValueOnce(axiosError(401))
        .mockRejectedValueOnce(axiosError(422));

      await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
        ComaredRequestRejectedException,
      );
    });

    it('no invalida el token ante errores distintos de 401', async () => {
      post.mockRejectedValue(axiosError(500));

      await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
      expect(authService.invalidateToken).not.toHaveBeenCalled();
      expect(post).toHaveBeenCalledTimes(1);
    });
  });

  it('lanza ComaredUnavailableException sin llamar a Comared si no obtiene el token inicial', async () => {
    authService.getToken.mockRejectedValue(new BadGatewayException('auth'));

    await expect(service.buy(buyBody)).rejects.toBeInstanceOf(
      ComaredUnavailableException,
    );
    expect(post).not.toHaveBeenCalled();
  });
});
