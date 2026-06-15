import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface CreateBoardPayload {
  title: string;
  description?: string;
}

export interface BoardResponse {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const defaultBoardPayload = (): CreateBoardPayload => ({
  title: 'Test Board',
  description: 'Test board description',
});

export async function createBoard(
  app: INestApplication,
  accessToken: string,
  payload: CreateBoardPayload = defaultBoardPayload(),
): Promise<BoardResponse> {
  const response = await request(app.getHttpServer())
    .post('/boards')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(payload)
    .expect(201);

  return response.body;
}
