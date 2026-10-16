import { describe, it, expect, beforeEach, jest } from '@jest/globals';

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

  it('register delega en el servicio', async () => {
    const request = { name: 'Ana', email: 'ana@correo.com', password: '12345678' };
    const response = { id: 'u1', name: 'Ana', email: 'ana@correo.com' };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(request)).resolves.toBe(response);
    expect(authService.register).toHaveBeenCalledWith(request);
  });

  it('login delega en el servicio', async () => {
    const request = { email: 'ana@correo.com', password: '12345678' };
    const response = { accessToken: 'jwt' } as LoginResponseDto;
    authService.login.mockResolvedValue(response);

    await expect(controller.login(request)).resolves.toBe(response);
    expect(authService.login).toHaveBeenCalledWith(request);
  });
});
