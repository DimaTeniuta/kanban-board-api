import { ApiProperty } from '@nestjs/swagger';

export class DeleteTaskResult {
  @ApiProperty()
  readonly message: string;
}
