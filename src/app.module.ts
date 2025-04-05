import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { IS_DEV_ENV } from 'utils/isDev.util';

import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: !IS_DEV_ENV,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME') },
      }),
    }),
    UserModule,
    AuthModule,
    PrismaModule,
    RedisModule,
    BoardsModule,
  ],
})
export class AppModule {}
