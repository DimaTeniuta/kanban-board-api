import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { Request } from 'express';
import { type Redis } from 'ioredis';
import { extractUserPassword } from 'utils/extractUserPassword.util';
import { ms, StringValue } from 'utils/ms.util';

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
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
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
      throw new ForbiddenException('Invalid credentials');
    }

    return user;
  }

  public async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });

    await this.redisClient.set(
      `refresh:${user.id}`,
      refreshToken,
      'EX',
      this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    );

    return {
      user: extractUserPassword(user),
      accessToken,
      refreshToken,
    };
  }

  public async refreshToken(dto: { userId: string; refreshToken: string }) {
    const storedRefreshToken = await this.redisClient.get(`refresh:${dto.userId}`);

    if (!storedRefreshToken || storedRefreshToken !== dto.refreshToken) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const payload = { sub: dto.userId };
    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });

    await this.redisClient.set(
      `refresh:${dto.userId}`,
      newRefreshToken,
      'EX',
      ms(this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME') as StringValue),
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
