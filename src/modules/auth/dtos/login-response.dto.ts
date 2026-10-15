export class LoginUserDto {
  name: string;
  email: string;
}

export class LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  user: LoginUserDto;
}
