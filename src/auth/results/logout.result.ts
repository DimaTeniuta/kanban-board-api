import { ApiProperty } from '@nestjs/swagger';

export class LogoutResult {
  @ApiProperty()
  readonly message: string;
}
