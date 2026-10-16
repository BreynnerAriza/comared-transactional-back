import { describe, it, expect } from '@jest/globals';

import { AuthMapper } from './auth.mapper';
import { UserEntity } from '../../users/entities/user.entity';

const user = Object.assign(new UserEntity(), {
  id: 'u1',
  name: 'Ana',
  email: 'ana@correo.com',
  passwordHash: 'hash-secreto',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('AuthMapper', () => {
  describe('toRegisterResponse', () => {
    it('devuelve id, nombre y email sin el hash de la contraseña', () => {
      const result = AuthMapper.toRegisterResponse(user);

      expect(result).toStrictEqual({
        id: 'u1',
        name: 'Ana',
        email: 'ana@correo.com',
      });
    });
  });

  describe('toLoginResponse', () => {
    it('devuelve el token como Bearer y solo nombre y email del usuario', () => {
      const result = AuthMapper.toLoginResponse(user, 'jwt-token');

      expect(result).toStrictEqual({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        user: { name: 'Ana', email: 'ana@correo.com' },
      });
    });
  });
});
