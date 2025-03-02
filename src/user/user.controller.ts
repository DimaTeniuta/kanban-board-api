import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { extractUserPassword } from 'utils/extractUserPassword.util';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

import { UserResult } from './results/user.result';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Profile',
    status: HttpStatus.OK,
    type: UserResult,
  })
  public async profile(@Req() req: Request) {
    const user = await this.userService.findById(req.user.userId);

    return extractUserPassword(user);
  }
}
