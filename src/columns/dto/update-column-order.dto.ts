import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateColumnOrderDto {
  @ApiProperty()
  @IsInt({ message: 'newOrder must be an integer.' })
  @IsNotEmpty({ message: 'newOrder is required.' })
  newOrder: number;
}
