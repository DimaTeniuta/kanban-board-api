import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface CreateColumnPayload {
  title: string;
}

export interface ColumnResponse {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export const defaultColumnPayload = (): CreateColumnPayload => ({
  title: 'To Do',
});

export async function createColumn(
  app: INestApplication,
  accessToken: string,
  boardId: string,
  payload: CreateColumnPayload = defaultColumnPayload(),
): Promise<ColumnResponse> {
  const response = await request(app.getHttpServer())
    .post(`/boards/${boardId}/columns`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(payload)
    .expect(201);

  return response.body;
}
