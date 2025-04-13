import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { RedisModule } from '@/redis/redis.module';
import { UserService } from '@/user/user.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule, RedisModule],
  controllers: [AuthController],
  providers: [AuthService, UserService],
  exports: [AuthService],
})
export class AuthModule {}
