import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateColumnOrderDto {
  @ApiProperty()
  @IsInt({ message: 'newOrder must be an integer.' })
  @IsNotEmpty({ message: 'newOrder is required.' })
  newOrder: number;

  @ApiProperty()
  @IsString({ message: 'columnId must be a string.' })
  @IsNotEmpty({ message: 'columnId is required.' })
  columnId: string;

  @ApiProperty()
  @IsString({ message: 'boardId must be a string.' })
  @IsNotEmpty({ message: 'boardId is required.' })
  boardId: string;
}
