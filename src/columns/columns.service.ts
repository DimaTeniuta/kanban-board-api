import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getAll(boardId: string, userId: string) {
    await this.findBoard(boardId, userId);

    const columns = await this.prismaService.column.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
    });

    return columns;
  }

  public async getById(boardId: string, columnId: string, userId: string) {
    await this.findBoard(boardId, userId);

    const column = await this.findColumn(columnId, boardId);

    return column;
  }

  public async create(dto: CreateColumnDto, userId: string) {
    await this.findBoard(dto.boardId, userId);

    const maxOrderColumn = await this.prismaService.column.findFirst({
      where: { boardId: dto.boardId },
      orderBy: { order: 'desc' },
    });

    const order = maxOrderColumn ? maxOrderColumn.order + 1 : 0;

    const column = await this.prismaService.column.create({
      data: {
        ...dto,
        order,
      },
    });

    return column;
  }

  public async update(dto: UpdateColumnDto, userId: string) {
    await this.findBoard(dto.boardId, userId);

    await this.findColumn(dto.columnId, dto.boardId);

    const updatedColumn = await this.prismaService.column.update({
      where: {
        id: dto.columnId,
      },
      data: {
        title: dto.title,
      },
    });

    return updatedColumn;
  }
  public async delete(boardId: string, columnId: string, userId: string) {
    await this.findBoard(boardId, userId);

    await this.findColumn(columnId, boardId);

    await this.prismaService.column.delete({
      where: {
        id: columnId,
      },
    });

    return {
      message: 'Column has been successfully deleted.',
    };
  }

  private async findBoard(boardId: string, userId: string) {
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

  private async findColumn(columnId: string, boardId: string) {
    const column = await this.prismaService.column.findUnique({
      where: {
        id: columnId,
        boardId,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return column;
  }
}
