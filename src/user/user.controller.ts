import { Body, Controller, Delete, Get, HttpStatus, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { extractUserPassword } from 'utils/extractUserPassword.util';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserResult } from './results/delete.result';
import { UserResult } from './results/user.result';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get User Profile',
    status: HttpStatus.OK,
    type: UserResult,
  })
  public async profile(@Req() req: Request) {
    const user = await this.userService.findById(req.user.userId);

    return extractUserPassword(user);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    description: 'Update User Profile',
    status: HttpStatus.OK,
    type: UserResult,
  })
  public async update(@Req() req: Request, @Body() body: UpdateUserDto) {
    const user = await this.userService.update(req.user.userId, body);

    return extractUserPassword(user);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Delete User',
    status: HttpStatus.OK,
    type: DeleteUserResult,
  })
  public async delete(@Req() req: Request) {
    const result = await this.userService.delete(req.user.userId);

    return result;
  }
}
