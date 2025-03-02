import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/__generated__';

export class UserResult {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly picture?: string | null;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  readonly role: UserRole;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  readonly createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00Z' })
  readonly updatedAt: Date;
}
