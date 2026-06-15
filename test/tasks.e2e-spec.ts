import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { registerUser } from './helpers/auth.fixtures';
import { createBoard } from './helpers/boards.fixtures';
import { createColumn } from './helpers/columns.fixtures';
import { createTestApp } from './helpers/create-test-app';
import { createTask, defaultTaskPayload } from './helpers/tasks.fixtures';
import { cleanDatabase, closeTestApp } from './helpers/test-database';

describe('Tasks (e2e)', () => {
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

  describe('GET /boards/:boardId/columns/:columnId/tasks', () => {
    it('returns all tasks for a column ordered by order', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const firstTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'First Task',
        priority: 'LOW',
      });
      const secondTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Second Task',
        priority: 'HIGH',
      });

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0]).toMatchObject({
        id: firstTask.id,
        title: 'First Task',
        order: 0,
        priority: 'LOW',
        columnId: column.id,
      });
      expect(response.body.tasks[1]).toMatchObject({
        id: secondTask.id,
        title: 'Second Task',
        order: 1,
        priority: 'HIGH',
        columnId: column.id,
      });
    });

    it('returns an empty list when column has no tasks', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.tasks).toEqual([]);
    });

    it('returns 404 when board does not exist', async () => {
      const user = await registerUser(app);

      const response = await request(app.getHttpServer())
        .get(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks',
        )
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 404 when column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/00000000-0000-0000-0000-000000000000/tasks`)
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
        .get(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .get(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks',
        )
        .expect(401);
    });
  });

  describe('GET /boards/:boardId/columns/:columnId/tasks/:taskId', () => {
    it('returns a task by id', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const task = await createTask(app, user.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: task.id,
        title: task.title,
        description: task.description,
        order: 0,
        priority: 'NONE',
        columnId: column.id,
      });
    });

    it('returns 404 when task does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);
      const task = await createTask(app, owner.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .get(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000',
        )
        .expect(401);
    });
  });

  describe('POST /boards/:boardId/columns/:columnId/tasks', () => {
    it('creates a task with incremental order', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const firstResponse = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'First Task', priority: 'LOW' })
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Second Task', priority: 'CRITICAL' })
        .expect(201);

      expect(firstResponse.body).toMatchObject({
        title: 'First Task',
        order: 0,
        priority: 'LOW',
        columnId: column.id,
      });
      expect(secondResponse.body).toMatchObject({
        title: 'Second Task',
        order: 1,
        priority: 'CRITICAL',
        columnId: column.id,
      });
    });

    it('creates a task without description', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Task without description', priority: 'MEDIUM' })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Task without description',
        description: null,
        priority: 'MEDIUM',
        columnId: column.id,
      });
    });

    it('returns 400 when title is missing', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ priority: 'NONE' })
        .expect(400);

      expect(response.body.message).toEqual(expect.arrayContaining(['title is required.']));
    });

    it('returns 400 when priority is invalid', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Invalid priority task', priority: 'INVALID' })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['priority must be one of: LOW, MEDIUM, HIGH, CRITICAL, NONE']),
      );
    });

    it('returns 404 when column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);

      const response = await request(app.getHttpServer())
        .post(`/boards/${board.id}/columns/00000000-0000-0000-0000-000000000000/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(defaultTaskPayload())
        .expect(404);

      expect(response.body.message).toBe('Column not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .post(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks',
        )
        .send(defaultTaskPayload())
        .expect(401);
    });
  });

  describe('PATCH /boards/:boardId/columns/:columnId/tasks/:taskId', () => {
    it('updates a task', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const task = await createTask(app, user.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          title: 'Updated Task',
          description: 'Updated description',
          priority: 'HIGH',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: task.id,
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'HIGH',
        columnId: column.id,
      });
    });

    it('updates only provided fields', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const task = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Original Task',
        description: 'Original description',
        priority: 'LOW',
      });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ priority: 'CRITICAL' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: task.id,
        title: 'Original Task',
        description: 'Original description',
        priority: 'CRITICAL',
      });
    });

    it('returns 404 when task does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .patch(
          `/boards/${board.id}/columns/${column.id}/tasks/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Task' })
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);
      const task = await createTask(app, owner.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ title: 'Hijacked Task' })
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .patch(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000',
        )
        .send({ title: 'Updated Task' })
        .expect(401);
    });
  });

  describe('DELETE /boards/:boardId/columns/:columnId/tasks/:taskId', () => {
    it('deletes a task and reorders remaining tasks', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const firstTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'First Task',
        priority: 'NONE',
      });
      const secondTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Second Task',
        priority: 'NONE',
      });
      const thirdTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Third Task',
        priority: 'NONE',
      });

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}/columns/${column.id}/tasks/${secondTask.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Task has been successfully deleted.',
      });

      const listResponse = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(listResponse.body.tasks).toHaveLength(2);
      expect(listResponse.body.tasks[0]).toMatchObject({
        id: firstTask.id,
        order: 0,
      });
      expect(listResponse.body.tasks[1]).toMatchObject({
        id: thirdTask.id,
        order: 1,
      });
    });

    it('returns 404 when task does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .delete(
          `/boards/${board.id}/columns/${column.id}/tasks/00000000-0000-0000-0000-000000000000`,
        )
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);
      const task = await createTask(app, owner.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .delete(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .delete(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000',
        )
        .expect(401);
    });
  });

  describe('PATCH /boards/:boardId/columns/:columnId/tasks/:taskId/order', () => {
    it('updates task order within the same column', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const firstTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'First Task',
        priority: 'NONE',
      });
      const secondTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Second Task',
        priority: 'NONE',
      });
      const thirdTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Third Task',
        priority: 'NONE',
      });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${firstTask.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 2, newColumnId: column.id })
        .expect(200);

      expect(response.body).toMatchObject({
        id: firstTask.id,
        order: 2,
        columnId: column.id,
      });

      const listResponse = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const ordersById = Object.fromEntries(
        listResponse.body.tasks.map((task: { id: string; order: number }) => [task.id, task.order]),
      );

      expect(ordersById[secondTask.id]).toBe(0);
      expect(ordersById[thirdTask.id]).toBe(1);
      expect(ordersById[firstTask.id]).toBe(2);
    });

    it('moves a task up within the same column', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const firstTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'First Task',
        priority: 'NONE',
      });
      const secondTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Second Task',
        priority: 'NONE',
      });
      const thirdTask = await createTask(app, user.accessToken, board.id, column.id, {
        title: 'Third Task',
        priority: 'NONE',
      });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${thirdTask.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 0, newColumnId: column.id })
        .expect(200);

      expect(response.body).toMatchObject({
        id: thirdTask.id,
        order: 0,
        columnId: column.id,
      });

      const listResponse = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${column.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      const ordersById = Object.fromEntries(
        listResponse.body.tasks.map((task: { id: string; order: number }) => [task.id, task.order]),
      );

      expect(ordersById[thirdTask.id]).toBe(0);
      expect(ordersById[firstTask.id]).toBe(1);
      expect(ordersById[secondTask.id]).toBe(2);
    });

    it('moves a task to another column', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const sourceColumn = await createColumn(app, user.accessToken, board.id, {
        title: 'To Do',
      });
      const targetColumn = await createColumn(app, user.accessToken, board.id, {
        title: 'Done',
      });
      const taskToMove = await createTask(app, user.accessToken, board.id, sourceColumn.id, {
        title: 'Move me',
        priority: 'NONE',
      });
      const remainingTask = await createTask(app, user.accessToken, board.id, sourceColumn.id, {
        title: 'Stay here',
        priority: 'NONE',
      });
      const targetTask = await createTask(app, user.accessToken, board.id, targetColumn.id, {
        title: 'Existing target task',
        priority: 'NONE',
      });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${sourceColumn.id}/tasks/${taskToMove.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 0, newColumnId: targetColumn.id })
        .expect(200);

      expect(response.body).toMatchObject({
        id: taskToMove.id,
        order: 0,
        columnId: targetColumn.id,
      });

      const sourceTasks = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${sourceColumn.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(sourceTasks.body.tasks).toHaveLength(1);
      expect(sourceTasks.body.tasks[0]).toMatchObject({
        id: remainingTask.id,
        order: 0,
      });

      const targetTasks = await request(app.getHttpServer())
        .get(`/boards/${board.id}/columns/${targetColumn.id}/tasks`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(targetTasks.body.tasks).toHaveLength(2);
      expect(targetTasks.body.tasks[0]).toMatchObject({
        id: taskToMove.id,
        order: 0,
      });
      expect(targetTasks.body.tasks[1]).toMatchObject({
        id: targetTask.id,
        order: 1,
      });
    });

    it('returns 400 for invalid order value within the same column', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const task = await createTask(app, user.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 5, newColumnId: column.id })
        .expect(400);

      expect(response.body.message).toBe('Invalid order value');
    });

    it('returns 400 for negative order value', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const task = await createTask(app, user.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: -1, newColumnId: column.id })
        .expect(400);

      expect(response.body.message).toBe('Invalid order value');
    });

    it('returns 400 for invalid order when moving to another column', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const sourceColumn = await createColumn(app, user.accessToken, board.id, { title: 'To Do' });
      const targetColumn = await createColumn(app, user.accessToken, board.id, { title: 'Done' });
      const taskToMove = await createTask(app, user.accessToken, board.id, sourceColumn.id, {
        title: 'Move me',
        priority: 'NONE',
      });
      await createTask(app, user.accessToken, board.id, targetColumn.id, {
        title: 'Existing target task',
        priority: 'NONE',
      });

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${sourceColumn.id}/tasks/${taskToMove.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 2, newColumnId: targetColumn.id })
        .expect(400);

      expect(response.body.message).toBe('Invalid order value');
    });

    it('returns 404 when task does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);

      const response = await request(app.getHttpServer())
        .patch(
          `/boards/${board.id}/columns/${column.id}/tasks/00000000-0000-0000-0000-000000000000/order`,
        )
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ newOrder: 0, newColumnId: column.id })
        .expect(404);

      expect(response.body.message).toBe('Task not found');
    });

    it('returns 404 when target column does not exist', async () => {
      const user = await registerUser(app);
      const board = await createBoard(app, user.accessToken);
      const column = await createColumn(app, user.accessToken, board.id);
      const task = await createTask(app, user.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}/order`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          newOrder: 0,
          newColumnId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);

      expect(response.body.message).toBe('Column not found');
    });

    it('returns 404 when board belongs to another user', async () => {
      const owner = await registerUser(app);
      const otherUser = await registerUser(app);
      const board = await createBoard(app, owner.accessToken);
      const column = await createColumn(app, owner.accessToken, board.id);
      const task = await createTask(app, owner.accessToken, board.id, column.id);

      const response = await request(app.getHttpServer())
        .patch(`/boards/${board.id}/columns/${column.id}/tasks/${task.id}/order`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ newOrder: 0, newColumnId: column.id })
        .expect(404);

      expect(response.body.message).toBe('Board not found');
    });

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .patch(
          '/boards/00000000-0000-0000-0000-000000000000/columns/00000000-0000-0000-0000-000000000000/tasks/00000000-0000-0000-0000-000000000000/order',
        )
        .send({ newOrder: 0, newColumnId: '00000000-0000-0000-0000-000000000000' })
        .expect(401);
    });
  });
});
