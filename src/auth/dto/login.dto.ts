import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString({ message: 'email must be a string.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @ApiProperty()
  @IsString({ message: 'password must be a string.' })
  @IsNotEmpty({ message: 'password field cannot be empty.' })
  @MinLength(6, { message: 'password must be at least 6 characters long.' })
  password: string;
}
