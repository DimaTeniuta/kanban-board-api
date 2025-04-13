import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/__generated__';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsString({ message: 'title must be a string.' })
  @IsNotEmpty({ message: 'title is required.' })
  @MaxLength(100, { message: 'title must be at most 100 characters long.' })
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'description must be a string.' })
  @MaxLength(300, { message: 'description must be at most 300 characters long.' })
  description: string;

  @ApiProperty({ enum: TaskPriority, enumName: 'TaskPriority' })
  priority: TaskPriority;
}
