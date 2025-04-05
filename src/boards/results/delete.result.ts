import { ApiProperty } from '@nestjs/swagger';

export class DeleteBoardResult {
  @ApiProperty()
  readonly message: string;
}
