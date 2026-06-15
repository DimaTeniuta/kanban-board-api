import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { defaultTestUser, registerUser } from './helpers/auth.fixtures';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, closeTestApp } from './helpers/test-database';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('POST /auth/register', () => {
    it('registers a new user', async () => {
      const credentials = defaultTestUser();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(200);

      expect(response.body).toEqual({
        message: 'You have successfully registered.',
      });
    });

    it('returns 409 when email already exists', async () => {
      const credentials = defaultTestUser();

      await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(200);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(409);

      expect(response.body.message).toBe(`User with ${credentials.email} already exists`);
    });

    it('returns 400 when passwords do not match', async () => {
      const credentials = defaultTestUser();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...credentials, passwordRepeat: 'different-password' })
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['password do not match.']));
    });

    it('returns 400 when password is too short', async () => {
      const credentials = defaultTestUser();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...credentials,
          password: '12345',
          passwordRepeat: '12345',
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['password must be at least 6 characters long.']),
      );
    });

    it('returns 400 when email is invalid', async () => {
      const credentials = defaultTestUser();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...credentials, email: 'not-an-email' })
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['Invalid email format.']));
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'name is required.',
          'email is required.',
          'password is required.',
          'password confirmation cannot be empty.',
        ]),
      );
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials', async () => {
      const credentials = defaultTestUser();

      await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(200);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: credentials.email, password: credentials.password })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(response.body.user).toMatchObject({
        email: credentials.email,
        name: credentials.name,
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('returns 403 for invalid password', async () => {
      const credentials = defaultTestUser();

      await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(200);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: credentials.email, password: 'wrong-password' })
        .expect(403);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('returns 403 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'missing@example.com', password: 'password123' })
        .expect(403);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('returns 400 when email is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['Invalid email format.']));
    });

    it('returns 400 when password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: '12345' })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['password must be at least 6 characters long.']),
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('logs out an authenticated user', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'You have successfully logged out.',
      });
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('invalidates refresh token after logout', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ userId: user.id, refreshToken: user.refreshToken })
        .expect(403);

      expect(response.body.message).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ userId: user.id, refreshToken: user.refreshToken })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).not.toBe(user.refreshToken);
    });

    it('returns 403 for an invalid refresh token', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ userId: user.id, refreshToken: 'invalid-refresh-token' })
        .expect(403);

      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('returns 403 for a mismatched userId', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          refreshToken: user.refreshToken,
        })
        .expect(403);

      expect(response.body.message).toBe('Invalid or expired refresh token');
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['userId is required.', 'refreshToken is required.']),
      );
    });
  });
});
