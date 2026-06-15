import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { registerUser } from './helpers/auth.fixtures';
import { createBoard } from './helpers/boards.fixtures';
import { createColumn, defaultColumnPayload } from './helpers/columns.fixtures';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, closeTestApp } from './helpers/test-database';

describe('Columns (e2e)', () => {
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

  describe('GET /boards/:boardId/columns', () => {
    it('returns all columns for a board ordered by order', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const firstColumn = await createColumn(app, user.accessToken, board.id, { title: 'To Do' });
      const secondColumn = await createColumn(app, user.accessToken, board.id, {
        title: 'In Progress',
      });

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.columns).toHaveLength(2);
      expect(response.body.columns[0]).toMatchObject({
        id: firstColumn.id,
        title: 'To Do',
        order: 0,
        boardId: board.id,
      });
      expect(response.body.columns[1]).toMatchObject({
        id: secondColumn.id,
        title: 'In Progress',
        order: 1,
        boardId: board.id,
      });
    });

    it('returns an empty list when board has no columns', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.columns).toEqual([]);
    });

    it('returns 404 when board does not exist', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .get('/boards/00000000-0000-0000-0000-000000000000/columns')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .get('/boards/00000000-0000-0000-0000-000000000000/columns')
        .expect(401);
    });
  });

  describe('GET /boards/:boardId/columns/:columnId', () => {
    it('returns a column by id', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: column.id,
        title: column.title,
        order: 0,
        boardId: board.id,
      });
    });

    it('returns 404 when column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Column not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .get(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000',
        )
        .expect(401);
    });
  });

  describe('POST /boards/:boardId/columns', () => {
    it('creates a column with incremental order', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const firstResponse = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'To Do' })
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Done' })
        .expect(201);

      expect(firstResponse.body).toMatchObject({
        title: 'To Do',
        order: 0,
        boardId: board.id,
      });
      expect(secondResponse.body).toMatchObject({
        title: 'Done',
        order: 1,
        boardId: board.id,
      });
    });

    it('returns 400 when title is missing', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['title is required.']));
    });

    it('returns 400 when title exceeds max length', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'a'.repeat(101) })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['title must be at most 100 characters long.']),
      );
    });

    it('returns 404 when board does not exist', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .post('/boards/00000000-0000-0000-0000-000000000000/columns')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(defaultColumnPayload())
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/boards/00000000-0000-0000-0000-000000000000/columns')
        .send(defaultColumnPayload())
        .expect(401);
    });
  });

  describe('PUT /boards/:boardId/columns/:columnId', () => {
    it('updates a column title', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .put(`/boards/${board.id}/columns/${column.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Column' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: column.id,
        title: 'Updated Column',
        order: column.order,
        boardId: board.id,
      });
    });

    it('returns 400 when title is missing', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .put(`/boards/${board.id}/columns/${column.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['title is required.']));
    });

    it('returns 404 when column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .put(`/boards/${board.id}/columns/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Column' })
        .expect(404);

      expect(response.body.message).toBe('Column not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .put(`/boards/${board.id}/columns/${column.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ title: 'Hijacked Column' })
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .put(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000',
        )
        .send({ title: 'Updated Column' })
        .expect(401);
    });
  });

  describe('DELETE /boards/:boardId/columns/:columnId', () => {
    it('deletes a column and reorders remaining columns', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const firstColumn = await createColumn(app, user.accessToken, board.id, { title: 'To Do' });
      const secondColumn = await createColumn(app, user.accessToken, board.id, {
        title: 'In Progress',
      });
      const thirdColumn = await createColumn(app, user.accessToken, board.id, { title: 'Done' });

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}/columns/${secondColumn.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Column has been successfully deleted and orders updated.',
      });

      const listResponse = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(listResponse.body.columns).toHaveLength(2);
      expect(listResponse.body.columns[0]).toMatchObject({
        id: firstColumn.id,
        order: 0,
      });
      expect(listResponse.body.columns[1]).toMatchObject({
        id: thirdColumn.id,
        order: 1,
      });
    });

    it('returns 404 when column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}/columns/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Column not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}/columns/${column.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .delete(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000',
        )
        .expect(401);
    });
  });

  describe('PATCH /boards/:boardId/columns/:columnId/order', () => {
    it('updates column order', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const firstColumn = await createColumn(app, user.accessToken, board.id, { title: 'To Do' });
      const secondColumn = await createColumn(app, user.accessToken, board.id, {
        title: 'In Progress',
      });
      const thirdColumn = await createColumn(app, user.accessToken, board.id, { title: 'Done' });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${firstColumn.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 2 })
        .expect(200);

      expect(response.body).toMatchObject({
        id: firstColumn.id,
        order: 2,
      });

      const listResponse = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const ordersById = Object.fromEntries(
        listResponse.body.columns.map((column: { id: string; order: number }) => [
          column.id,
          column.order,
        ]),
      );

      expect(ordersById[secondColumn.id]).toBe(0);
      expect(ordersById[thirdColumn.id]).toBe(1);
      expect(ordersById[firstColumn.id]).toBe(2);
    });

    it('moves a column up when newOrder is less than current order', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const firstColumn = await createColumn(app, user.accessToken, board.id, { title: 'To Do' });
      const secondColumn = await createColumn(app, user.accessToken, board.id, {
        title: 'In Progress',
      });
      const thirdColumn = await createColumn(app, user.accessToken, board.id, { title: 'Done' });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${thirdColumn.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 0 })
        .expect(200);

      expect(response.body).toMatchObject({
        id: thirdColumn.id,
        order: 0,
      });

      const listResponse = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const ordersById = Object.fromEntries(
        listResponse.body.columns.map((column: { id: string; order: number }) => [
          column.id,
          column.order,
        ]),
      );

      expect(ordersById[thirdColumn.id]).toBe(0);
      expect(ordersById[firstColumn.id]).toBe(1);
      expect(ordersById[secondColumn.id]).toBe(2);
    });

    it('returns 400 for invalid order value', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 5 })
        .expect(400);

      expect(response.body.message).toBe('Invalid order value');
    });

    it('returns 404 when column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/00000000-0000-0000-0000-000000000000/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 0 })
        .expect(404);

      expect(response.body.message).toBe('Column not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/order`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ newOrder: 0 })
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .patch(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/order',
        )
        .send({ newOrder: 0 })
        .expect(401);
    });
  });
});
