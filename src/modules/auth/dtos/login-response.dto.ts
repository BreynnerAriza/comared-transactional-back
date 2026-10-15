/** Datos públicos del usuario en el login: no expone el identificador interno. */
export class LoginUserDto {
  name: string;
  email: string;
}

export class LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  user: LoginUserDto;
}
