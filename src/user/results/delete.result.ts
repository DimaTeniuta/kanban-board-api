import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserResult {
  @ApiProperty()
  readonly message: string;
}
