import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import type { AuthService } from '../services/auth.service';
import { LoginResponseDto } from '../dtos/login-response.dto';

describe('AuthController', () => {
  const authService = {
    register: jest.fn<AuthService['register']>(),
    login: jest.fn<AuthService['login']>(),
  };

  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(authService as unknown as AuthService);
  });

  describe('register', () => {
    const request = { name: 'Ana', email: 'ana@correo.com', password: '12345678' };

    beforeEach(() => {
      process.env.REGISTER_API_KEY = 'clave-secreta';
    });

    afterEach(() => {
      delete process.env.REGISTER_API_KEY;
    });

    it('delega en el servicio cuando la x-api-key es válida', async () => {
      const response = { id: 'u1', name: 'Ana', email: 'ana@correo.com' };
      authService.register.mockResolvedValue(response);

      await expect(controller.register('clave-secreta', request)).resolves.toBe(response);
      expect(authService.register).toHaveBeenCalledWith(request);
    });

    it.each([undefined, '', 'otra-clave'])(
      'rechaza la petición cuando la x-api-key es %p',
      async (apiKey) => {
        await expect(controller.register(apiKey, request)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(authService.register).not.toHaveBeenCalled();
      },
    );

    it('rechaza la petición cuando REGISTER_API_KEY no está configurada', async () => {
      delete process.env.REGISTER_API_KEY;

      await expect(controller.register(undefined, request)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  it('login delega en el servicio', async () => {
    const request = { email: 'ana@correo.com', password: '12345678' };
    const response = { accessToken: 'jwt' } as LoginResponseDto;
    authService.login.mockResolvedValue(response);

    await expect(controller.login(request)).resolves.toBe(response);
    expect(authService.login).toHaveBeenCalledWith(request);
  });
});
