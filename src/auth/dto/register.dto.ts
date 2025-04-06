import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';

import { IsPasswordsMatchingConstraint } from '@/lib/common/decorators/isPasswordsMatchingConstant.decorator';

export class RegisterDto {
  @ApiProperty()
  @IsString({ message: 'name must be a string.' })
  @IsNotEmpty({ message: 'name is required.' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'email must be a string.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'email is required.' })
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString({ message: 'password must be a string.' })
  @IsNotEmpty({ message: 'password is required.' })
  @MinLength(6, {
    message: 'password must be at least 6 characters long.',
  })
  password: string;

  @ApiProperty({ minLength: 6 })
  @IsString({ message: 'password confirmation must be a string.' })
  @IsNotEmpty({ message: 'password confirmation cannot be empty.' })
  @MinLength(6, {
    message: 'password confirmation must be at least 6 characters long.',
  })
  @Validate(IsPasswordsMatchingConstraint, {
    message: 'password do not match.',
  })
  passwordRepeat: string;
}
