import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import { CurrentUser } from '../../../common/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../dtos/authenticated-user.interface';
import type { LoginResponse } from '../dtos/login-response.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() request: RegisterRequestDto,
  ): Promise<AuthenticatedUser> {
    return this.authService.register(request);
  }

  @Public()
  @Post('login')
  async login(@Body() request: LoginRequestDto): Promise<LoginResponse> {
    return this.authService.login(request);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
  
}