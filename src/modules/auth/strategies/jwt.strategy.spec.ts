import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/services/users.service';
import { UserEntity } from '../../users/entities/user.entity';

const USER_ID = '3f1c2b9e-8a4d-4c7b-9e2f-1a2b3c4d5e6f';

describe('JwtStrategy', () => {
  const usersService = {
    findByIdOrThrow: jest.fn<UsersService['findByIdOrThrow']>(),
  };

  const user = Object.assign(new UserEntity(), {
    id: USER_ID,
    name: 'Ana',
    email: 'ana@correo.com',
    passwordHash: 'hash',
  });

  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(
      { secret: 'x'.repeat(32), expiresIn: 3600 },
      usersService as unknown as UsersService,
    );
  });

  it('devuelve solo id, nombre y email del usuario autenticado', async () => {
    usersService.findByIdOrThrow.mockResolvedValue(user);

    await expect(strategy.validate({ sub: USER_ID })).resolves.toStrictEqual({
      id: USER_ID,
      name: 'Ana',
      email: 'ana@correo.com',
    });
    expect(usersService.findByIdOrThrow).toHaveBeenCalledWith(USER_ID);
  });

  it.each([
    ['ausente', undefined],
    ['numérico', 123],
    ['que no es UUID', 'usuario-1'],
    ['UUID mal formado', '3f1c2b9e-8a4d-0c7b-9e2f-1a2b3c4d5e6f'],
  ])('rechaza un sub %s sin consultar la base de datos', async (_name, sub) => {
    await expect(
      strategy.validate({ sub } as unknown as { sub: string }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findByIdOrThrow).not.toHaveBeenCalled();
  });

  it('convierte NotFoundException en UnauthorizedException', async () => {
    usersService.findByIdOrThrow.mockRejectedValue(new NotFoundException());

    await expect(strategy.validate({ sub: USER_ID })).rejects.toThrow(
      new UnauthorizedException('El usuario autenticado no existe'),
    );
  });

  it('propaga cualquier otro error', async () => {
    const error = new InternalServerErrorException('BD caída');
    usersService.findByIdOrThrow.mockRejectedValue(error);

    await expect(strategy.validate({ sub: USER_ID })).rejects.toBe(error);
  });
});
