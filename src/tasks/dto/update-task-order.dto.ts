import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class UpdateTaskOrderDto {
  @ApiProperty()
  @IsInt({ message: 'newOrder must be an integer.' })
  newOrder: number;

  @ApiProperty()
  @IsString({ message: 'newColumnId must be a string.' })
  newColumnId: string;
}
