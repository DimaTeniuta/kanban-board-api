import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { registerUser } from './helpers/auth.fixtures';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, closeTestApp } from './helpers/test-database';

describe('Users (e2e)', () => {
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

  describe('GET /users/profile', () => {
    it('returns the authenticated user profile', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer()).get('/users/profile').expect(401);
    });

    it('returns 401 with invalid access token', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PUT /users/profile', () => {
    it('updates the authenticated user profile', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: user.email,
        name: 'Updated Name',
      });
      expect(response.body).not.toHaveProperty('password');

      const profileResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(profileResponse.body.name).toBe('Updated Name');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('returns 400 when name is missing', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['Name is required.']));
    });

    it('returns 400 when name is empty', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['Name is required.']));
    });
  });

  describe('DELETE /users/profile', () => {
    it('deletes the authenticated user profile', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .delete('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Your profile has been successfully deleted.',
      });

      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(403);
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer()).delete('/users/profile').expect(401);
    });
  });
});
