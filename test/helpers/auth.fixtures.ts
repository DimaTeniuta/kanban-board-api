import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface TestUserCredentials {
  name: string;
  email: string;
  password: string;
  passwordRepeat: string;
}

export interface RegisteredUser extends TestUserCredentials {
  id: string;
  accessToken: string;
  refreshToken: string;
}

export const defaultTestUser = (): TestUserCredentials => ({
  name: 'Test User',
  email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  password: 'password123',
  passwordRepeat: 'password123',
});

export async function registerUser(
  app: INestApplication,
  credentials: TestUserCredentials = defaultTestUser(),
): Promise<RegisteredUser> {
  await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(200);

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: credentials.email, password: credentials.password })
    .expect(200);

  return {
    ...credentials,
    id: loginResponse.body.user.id,
    accessToken: loginResponse.body.accessToken,
    refreshToken: loginResponse.body.refreshToken,
  };
}
