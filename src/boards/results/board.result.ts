import { ApiProperty } from '@nestjs/swagger';

export class BoardResult {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00Z' })
  updatedAt: Date;
}

export class BoardsResult {
  @ApiProperty({ type: BoardResult, isArray: true })
  boards: BoardResult[];
}
