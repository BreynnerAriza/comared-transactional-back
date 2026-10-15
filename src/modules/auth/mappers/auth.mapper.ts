import { UserEntity } from '../../users/entities/user.entity';
import { RegisterResponseDto } from '../dtos/register-response.dto';
import { LoginResponseDto } from '../dtos/login-response.dto';

export class AuthMapper {
  static toRegisterResponse(user: UserEntity): RegisterResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  static toLoginResponse(
    user: Pick<UserEntity, 'name' | 'email'>,
    accessToken: string,
  ): LoginResponseDto {
    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        name: user.name,
        email: user.email,
      },
    };
  }
}
