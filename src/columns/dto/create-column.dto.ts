import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty()
  @IsString({ message: 'title must be a string.' })
  @IsNotEmpty({ message: 'title is required.' })
  @MaxLength(100, { message: 'title must be at most 100 characters long.' })
  title: string;

  @ApiProperty()
  @IsString({ message: 'boardId must be a string.' })
  boardId: string;
}
