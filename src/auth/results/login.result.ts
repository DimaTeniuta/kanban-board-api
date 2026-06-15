import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00Z' })
  updatedAt: Date;
}

export class LoginResult {
  @ApiProperty({ type: UserDto })
  readonly user: UserDto;
  @ApiProperty()
  readonly accessToken: string;
  @ApiProperty()
  readonly refreshToken: string;
}
