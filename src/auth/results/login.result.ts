import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/__generated__';

class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  picture?: string | null;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;

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
  readonly arefreshToken: string;
}
