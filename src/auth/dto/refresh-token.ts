import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString({ message: 'userId must be a string.' })
  @IsNotEmpty({ message: 'userId is required.' })
  userId: string;

  @ApiProperty()
  @IsString({ message: 'refreshToken must be a string.' })
  @IsNotEmpty({ message: 'refreshToken is required.' })
  refreshToken: string;
}
