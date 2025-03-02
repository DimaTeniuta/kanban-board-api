import { ApiProperty } from '@nestjs/swagger';

export class RegisterResult {
  @ApiProperty()
  readonly message: string;
}
