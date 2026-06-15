import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LoginResult } from './results/login.result';
import { LogoutResult } from './results/logout.result';
import { RefreshTokenResult } from './results/refresh-token.result';
import { RegisterResult } from './results/register.result';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    description: 'Register',
    status: HttpStatus.OK,
    type: RegisterResult,
  })
  public async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    description: 'Login',
    status: HttpStatus.OK,
    type: LoginResult,
  })
  public async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiResponse({
    description: 'Logout',
    status: HttpStatus.OK,
    type: LogoutResult,
  })
  public async logout(@Req() req: Request) {
    return this.authService.logout(req.user.userId);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    description: 'Refresh token',
    status: HttpStatus.OK,
    type: RefreshTokenResult,
  })
  public async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }
}
