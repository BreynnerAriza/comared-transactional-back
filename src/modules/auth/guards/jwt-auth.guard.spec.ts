import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  const handler = () => undefined;
  class TestController {}

  const context = {
    getHandler: () => handler,
    getClass: () => TestController,
  } as unknown as ExecutionContext;

  const reflector = {
    getAllAndOverride: jest.fn<Reflector['getAllAndOverride']>(),
  };

  // canActivate de AuthGuard('jwt') ejecuta passport; se reemplaza para
  // comprobar solo si el guard delega o no.
  const passportCanActivate = jest.spyOn(
    Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: JwtAuthGuard['canActivate'];
    },
    'canActivate',
  );

  let guard: JwtAuthGuard;

  beforeEach(() => {
    passportCanActivate.mockReturnValue(Promise.resolve(true));
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  it('lee la metadata pública del handler y de la clase', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    void guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handler,
      TestController,
    ]);
  });

  it('permite el acceso a rutas públicas sin validar el JWT', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(passportCanActivate).not.toHaveBeenCalled();
  });

  it.each([false, undefined])(
    'delega en passport cuando la metadata pública es %p',
    async (isPublic) => {
      reflector.getAllAndOverride.mockReturnValue(isPublic);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(passportCanActivate).toHaveBeenCalledWith(context);
    },
  );
});
