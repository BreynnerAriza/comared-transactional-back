import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';

import type { AuthService as AuthServiceClass } from './auth.service';
import type { UsersService } from '../../users/services/users.service';
import { UserEntity } from '../../users/entities/user.entity';

// En modo ESM jest.mock() no funciona: argon2 se mockea con
// unstable_mockModule y el servicio se importa dinámicamente después.
const hash = jest.fn<(password: string) => Promise<string>>();
const verify = jest.fn<(hash: string, password: string) => Promise<boolean>>();
jest.unstable_mockModule('argon2', () => ({ hash, verify }));

let AuthService: typeof AuthServiceClass;

beforeAll(async () => {
  ({ AuthService } = await import('./auth.service.js'));
});

describe('AuthService', () => {
  const usersService = {
    create: jest.fn<UsersService['create']>(),
    findByEmailWithPassword: jest.fn<UsersService['findByEmailWithPassword']>(),
  };
  const jwtService = {
    signAsync: jest.fn<(payload: object) => Promise<string>>(),
  };

  const user = Object.assign(new UserEntity(), {
    id: 'u1',
    name: 'Ana',
    email: 'ana@correo.com',
    passwordHash: 'hash-guardado',
  });

  let service: AuthServiceClass;

  beforeEach(() => {
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  describe('register', () => {
    const request = {
      name: 'Ana',
      email: 'ana@correo.com',
      password: 'secreta123',
    };

    it('guarda el hash de la contraseña y no la contraseña en claro', async () => {
      hash.mockResolvedValue('hash-nuevo');
      usersService.create.mockResolvedValue(user);

      const result = await service.register(request);

      expect(hash).toHaveBeenCalledWith('secreta123');
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@correo.com',
        passwordHash: 'hash-nuevo',
      });
      expect(result).toStrictEqual({
        id: 'u1',
        name: 'Ana',
        email: 'ana@correo.com',
      });
    });

    it('propaga ConflictException si el email ya existe', async () => {
      hash.mockResolvedValue('hash-nuevo');
      usersService.create.mockRejectedValue(new ConflictException());

      await expect(service.register(request)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const request = { email: 'ana@correo.com', password: 'secreta123' };
    const invalidCredentials = 'Correo electrónico o contraseña incorrectos';

    it('firma un JWT con el id del usuario cuando las credenciales son válidas', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      verify.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(request);

      expect(verify).toHaveBeenCalledWith('hash-guardado', 'secreta123');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'u1' });
      expect(result).toStrictEqual({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        user: { name: 'Ana', email: 'ana@correo.com' },
      });
    });

    it('rechaza si el usuario no existe sin verificar contraseña', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(request)).rejects.toThrow(
        new UnauthorizedException(invalidCredentials),
      );
      expect(verify).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rechaza con el mismo mensaje si la contraseña es incorrecta', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);
      verify.mockResolvedValue(false);

      await expect(service.login(request)).rejects.toThrow(
        new UnauthorizedException(invalidCredentials),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
