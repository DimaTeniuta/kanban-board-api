import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new IORedis(configService.getOrThrow<string>('REDIS_URI'));
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
