import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateColumnOrderDto } from './dto/update-column-order.dto';

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

  public async create(dto: CreateColumnDto, boardId: string, userId: string) {
    await this.findBoard(boardId, userId);

    const maxOrderColumn = await this.prismaService.column.findFirst({
      where: { boardId: boardId },
      orderBy: { order: 'desc' },
    });

    const order = maxOrderColumn ? maxOrderColumn.order + 1 : 0;

    const column = await this.prismaService.column.create({
      data: {
        title: dto.title,
        boardId,
        order,
      },
    });

    return column;
  }

  public async update(dto: UpdateColumnDto, boardId: string, columnId: string, userId: string) {
    console.log(222, boardId, columnId);
    await this.findBoard(boardId, userId);
    await this.findColumn(columnId, boardId);

    const updatedColumn = await this.prismaService.column.update({
      where: {
        id: columnId,
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

    const columns = await this.prismaService.column.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
    });

    const updates: Promise<any>[] = [];

    for (let i = 0; i < columns.length; i++) {
      updates.push(
        this.prismaService.column.update({
          where: { id: columns[i].id },
          data: { order: i },
        }),
      );
    }

    await Promise.all(updates);

    return {
      message: 'Column has been successfully deleted and orders updated.',
    };
  }

  public async updateOrder(dto: UpdateColumnOrderDto, boardId: string, columnId, userId: string) {
    await this.findBoard(boardId, userId);

    const columns = await this.prismaService.column.findMany({
      where: { boardId: boardId },
      orderBy: { order: 'asc' },
    });

    const currentIndex = columns.findIndex((c) => c.id === columnId);
    if (currentIndex === -1) {
      throw new NotFoundException('Column not found');
    }

    const currentOrder = columns[currentIndex].order;
    const newOrder = dto.newOrder;

    if (newOrder < 0 || newOrder >= columns.length) {
      throw new BadRequestException('Invalid order value');
    }

    const updates: Promise<any>[] = [];

    if (newOrder > currentOrder) {
      // move down: all between currentOrder+1 and newOrder move up by 1
      for (const column of columns) {
        if (column.order > currentOrder && column.order <= newOrder) {
          updates.push(
            this.prismaService.column.update({
              where: { id: column.id },
              data: { order: column.order - 1 },
            }),
          );
        }
      }
    } else if (newOrder < currentOrder) {
      // move up: all between newOrder and currentOrder-1 move down by 1
      for (const column of columns) {
        if (column.order >= newOrder && column.order < currentOrder) {
          updates.push(
            this.prismaService.column.update({
              where: { id: column.id },
              data: { order: column.order + 1 },
            }),
          );
        }
      }
    }

    // Update the column itself
    updates.push(
      this.prismaService.column.update({
        where: { id: columnId },
        data: { order: newOrder },
      }),
    );

    await Promise.all(updates);

    return this.prismaService.column.findMany({
      where: { boardId: boardId },
      orderBy: { order: 'asc' },
    });
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
