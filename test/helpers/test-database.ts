import { INestApplication } from '@nestjs/common';
import { type Redis } from 'ioredis';

import { PrismaService } from '../../src/prisma/prisma.service';

export async function cleanDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const redis = app.get<Redis>('REDIS_CLIENT');

  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  const refreshKeys = await redis.keys('refresh:*');

  if (refreshKeys.length > 0) {
    await redis.del(...refreshKeys);
  }
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  const redis = app.get<Redis>('REDIS_CLIENT');

  await cleanDatabase(app);
  redis.disconnect();
  await app.close();
}
