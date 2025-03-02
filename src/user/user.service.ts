import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';

import { PrismaService } from '@/prisma/prisma.service';

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

  public async create(email: string, password: string, name: string, picture: string) {
    const saltOrRounds = 10;
    const hashedPassword = await hash(password, saltOrRounds);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        picture,
      },
    });

    return user;
  }
}
