import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import { Public } from '../decorators/public.decorator';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiExcludeEndpoint()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Headers('x-api-key') apiKey: string | undefined,
    @Body() request: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    const registerApiKey = process.env.REGISTER_API_KEY;

    if (!registerApiKey || apiKey !== registerApiKey) {
      throw new UnauthorizedException('API key inválida o ausente');
    }

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