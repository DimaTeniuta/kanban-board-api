import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getAll(userId: string) {
    const boards = await this.prismaService.board.findMany({
      where: {
        userId,
      },
    });

    return boards;
  }

  public async getById(boardId: string, userId: string) {
    const board = await this.findBoard(boardId, userId);

    return board;
  }

  public async create(dto: CreateBoardDto, userId: string) {
    const board = await this.prismaService.board.create({
      data: {
        ...dto,
        userId: userId,
      },
    });

    return board;
  }

  public async update(dto: UpdateBoardDto, boardId: string, userId: string) {
    const board = await this.findBoard(boardId, userId);

    const updatedBoard = await this.prismaService.board.update({
      where: {
        id: boardId,
      },
      data: {
        title: dto.title ?? board.title,
        description: dto.description ?? board.description,
      },
    });

    return updatedBoard;
  }

  public async delete(boardId: string, userId: string) {
    await this.findBoard(boardId, userId);

    await this.prismaService.board.delete({
      where: {
        id: boardId,
      },
    });

    return {
      message: 'Board has been successfully deleted.',
    };
  }

  public async findBoard(boardId: string, userId: string) {
    const board = await this.prismaService.board.findUnique({
      where: {
        id: boardId,
        userId,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }
}
