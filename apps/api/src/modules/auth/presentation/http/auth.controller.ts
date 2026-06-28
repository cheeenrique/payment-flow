import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RegisterUseCase } from '@/modules/auth/application/use-cases/register.use-case';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/modules/auth/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '@/modules/auth/application/use-cases/logout.use-case';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

interface MeResponse {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  handleRegister(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  handleLogin(@Body() dto: LoginDto) {
    return this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  handleRefresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute({ refreshToken: dto.refreshToken });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async handleLogout(@CurrentUser() user: AuthenticatedUser) {
    await this.logoutUseCase.execute(user.userId, user.email);
  }

  /** GET /auth/me — retorna o perfil do usuário autenticado (sem senha). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  handleMe(@CurrentUser() user: AuthenticatedUser): MeResponse {
    return {
      id: user.userId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
