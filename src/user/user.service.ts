import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';

import { PrismaService } from '@/prisma/prisma.service';

import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  public async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  public async create(email: string, password: string, name: string) {
    const saltOrRounds = 10;
    const hashedPassword = await hash(password, saltOrRounds);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return user;
  }

  public async update(userId: string, dto: UpdateUserDto) {
    const user = await this.findById(userId);

    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: dto.name,
      },
    });

    return updatedUser;
  }

  public async delete(userId: string) {
    const user = await this.findById(userId);

    await this.prismaService.user.delete({
      where: {
        id: user.id,
      },
    });

    return {
      message: 'Your profile has been successfully deleted.',
    };
  }
}
