import { ApiProperty } from '@nestjs/swagger';

export class ColumnResult {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  boardId: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00Z' })
  updatedAt: Date;
}

export class ColumnsResult {
  @ApiProperty({ type: ColumnResult })
  boards: ColumnResult[];
}
