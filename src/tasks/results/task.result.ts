import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/__generated__';

export class TaskResult {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ enum: TaskPriority, enumName: 'TaskPriority' })
  priority: TaskPriority;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00Z' })
  updatedAt: Date;
}

export class TasksResult {
  @ApiProperty({ type: TaskResult, isArray: true })
  tasks: TaskResult[];
}
