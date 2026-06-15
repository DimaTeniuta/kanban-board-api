import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { registerUser } from './helpers/auth.fixtures';
import { createBoard, defaultBoardPayload } from './helpers/boards.fixtures';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, closeTestApp } from './helpers/test-database';

describe('Boards (e2e)', () => {
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

  describe('GET /boards', () => {
    it('returns all boards for the authenticated user', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.boards).toHaveLength(1);
      expect(response.body.boards[0]).toMatchObject({
        id: board.id,
        title: board.title,
        description: board.description,
        userId: user.id,
      });
    });

    it('returns an empty list when user has no boards', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.boards).toEqual([]);
    });

    it('does not return boards belonging to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);

      await createBoard(app, owner.accessToken);

      const response = await request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(200);

      expect(response.body.boards).toEqual([]);
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer()).get('/boards').expect(401);
    });
  });

  describe('GET /boards/:id', () => {
    it('returns a board by id', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: board.id,
        title: board.title,
        description: board.description,
        userId: user.id,
      });
    });

    it('returns 404 when board does not exist', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .get('/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .get('/boards/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });

  describe('POST /boards', () => {
    it('creates a board', async () => {
      const user = await registerUser(app);
      const payload = defaultBoardPayload();

      const response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        title: payload.title,
        description: payload.description,
        userId: user.id,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('creates a board without description', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Board without description' })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Board without description',
        description: null,
        userId: user.id,
      });
    });

    it('returns 400 when title is missing', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ description: 'No title' })
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['title is required.']));
    });

    it('returns 400 when title exceeds max length', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'a'.repeat(101) })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['title must be at most 100 characters long.']),
      );
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer()).post('/boards').send(defaultBoardPayload()).expect(401);
    });
  });

  describe('PATCH /boards/:id', () => {
    it('updates a board', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Board', description: 'Updated description' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: board.id,
        title: 'Updated Board',
        description: 'Updated description',
        userId: user.id,
      });
    });

    it('updates only provided fields', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Only title updated' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: board.id,
        title: 'Only title updated',
        description: board.description,
      });
    });

    it('returns 404 when board does not exist', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .patch('/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Board' })
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ title: 'Hijacked Board' })
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .patch('/boards/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Updated Board' })
        .expect(401);
    });
  });

  describe('DELETE /boards/:id', () => {
    it('deletes a board', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Board has been successfully deleted.',
      });

      await request(app.getHttpServer())
        .get(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);
    });

    it('returns 404 when board does not exist', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .delete('/boards/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');

      await request(app.getHttpServer())
        .get(`/boards/${board.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .delete('/boards/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });
});
