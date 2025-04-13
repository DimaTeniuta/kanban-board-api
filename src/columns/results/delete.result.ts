import { ApiProperty } from '@nestjs/swagger';

export class DeleteColumnResult {
  @ApiProperty()
  readonly message: string;
}
