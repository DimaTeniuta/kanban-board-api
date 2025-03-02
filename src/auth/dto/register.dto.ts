import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Validate } from 'class-validator';

import { IsPasswordsMatchingConstraint } from '@/lib/common/decorators/isPasswordsMatchingConstant.decorator';

export class RegisterDto {
  @ApiProperty()
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'Email must be a string.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, {
    message: 'Password must be at least 6 characters long.',
  })
  password: string;

  @ApiProperty({ minLength: 6 })
  @IsString({ message: 'Password confirmation must be a string.' })
  @IsNotEmpty({ message: 'Password confirmation cannot be empty.' })
  @MinLength(6, {
    message: 'Password confirmation must be at least 6 characters long.',
  })
  @Validate(IsPasswordsMatchingConstraint, {
    message: 'Passwords do not match.',
  })
  passwordRepeat: string;
}
