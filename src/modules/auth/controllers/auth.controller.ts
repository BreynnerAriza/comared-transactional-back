import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import { CurrentUser } from '../../../common/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiCreatedResponse({
    description: 'Usuario registrado correctamente',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos de registro inválidos' })
  @ApiConflictResponse({ description: 'El correo electrónico ya está registrado' })
  async register(
    @Body() request: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(request);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener un token JWT' })
  @ApiOkResponse({
    description: 'Autenticación exitosa, retorna el token de acceso',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Datos de inicio de sesión inválidos' })
  @ApiUnauthorizedResponse({ description: 'Correo electrónico o contraseña incorrectos' })
  async login(@Body() request: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(request);
  }

}