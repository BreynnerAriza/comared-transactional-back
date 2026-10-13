import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import type { AuthenticatedUser } from '../dtos/authenticated-user.interface';
import type { LoginResponse } from '../dtos/login-response.interface';
import { UsersService } from '../../users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(request: RegisterRequestDto): Promise<AuthenticatedUser> {
    const passwordHash = await argon2.hash(request.password);

    const user = await this.usersService.create({
      name: request.name,
      email: request.email,
      passwordHash,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async login(request: LoginRequestDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmailWithPassword(request.email);

    if (!user) {
      throw new UnauthorizedException(
        'Correo electrónico o contraseña incorrectos',
      );
    }

    const validPassword = await argon2.verify(
      user.passwordHash,
      request.password,
    );

    if (!validPassword) {
      throw new UnauthorizedException(
        'Correo electrónico o contraseña incorrectos',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
