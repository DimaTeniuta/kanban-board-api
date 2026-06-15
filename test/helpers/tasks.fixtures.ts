import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  order: number;
  priority: string;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

export const defaultTaskPayload = (): CreateTaskPayload => ({
  title: 'Test Task',
  description: 'Task description',
  priority: 'NONE',
});

export async function createTask(
  app: INestApplication,
  accessToken: string,
  boardId: string,
  columnId: string,
  payload: CreateTaskPayload = defaultTaskPayload(),
): Promise<TaskResponse> {
  const response = await request(app.getHttpServer())
    .post(`/boards/${boardId}/columns/${columnId}/tasks`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(payload)
    .expect(201);

  return response.body;
}
