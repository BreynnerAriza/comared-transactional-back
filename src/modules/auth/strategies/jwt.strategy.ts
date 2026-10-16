import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../../../config/jwt.config';
import { UsersService } from '../../users/services/users.service';
import { AuthenticatedUser } from '../dtos/authenticated-user.interface';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY)
    config: ConfigType<typeof jwtConfig>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (
      typeof payload.sub !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.sub,
      )
    ) {
      throw new UnauthorizedException(
        'El token no contiene una identidad válida',
      );
    }

    const user = await this.usersService
      .findByIdOrThrow(payload.sub)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'NotFoundException') {
          throw new UnauthorizedException('El usuario autenticado no existe');
        }

        throw error;
      });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
  
}
