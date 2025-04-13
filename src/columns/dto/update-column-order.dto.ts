import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class UpdateColumnOrderDto {
  @ApiProperty()
  @IsInt({ message: 'newOrder must be an integer.' })
  newOrder: number;
}
