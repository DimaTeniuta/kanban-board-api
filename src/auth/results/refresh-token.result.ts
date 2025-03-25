import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResult {
  @ApiProperty()
  readonly accessToken: string;

  @ApiProperty()
  readonly refreshToken: string;
}
