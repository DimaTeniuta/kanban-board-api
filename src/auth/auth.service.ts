import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Request } from 'express';
import { extractUserPassword } from 'utils/extractUserPassword.util';

import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  public async register(req: Request, dto: RegisterDto) {
    const isExists = await this.userService.findByEmail(dto.email);

    if (isExists) {
      throw new ConflictException(`User with ${dto.email} already exists`);
    }

    await this.userService.create(dto.email, dto.password, dto.name, null);

    return {
      message: 'You have successfully registered.',
    };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || !(await compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  public async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    const payload = { sub: user.id, email: user.email };

    return {
      user: extractUserPassword(user),
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      }),
    };
  }
}
