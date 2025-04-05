import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}

  public async getAll(boardId: string, columnId: string, userId: string) {
    await this.findBoard(boardId, userId);
    await this.findColumn(columnId, boardId);

    const tasks = await this.prismaService.task.findMany({
      where: {
        columnId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return tasks;
  }

  public async getById(boardId: string, columnId: string, taskId: string, userId: string) {
    await this.findBoard(boardId, userId);
    await this.findColumn(columnId, boardId);

    const task = await this.prismaService.task.findUnique({
      where: {
        id: taskId,
      },
    });

    return task;
  }

  public async create(dto: CreateTaskDto, userId: string) {
    await this.findBoard(dto.boardId, userId);
    await this.findColumn(dto.columnId, dto.boardId);

    const maxOrderTask = await this.prismaService.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { order: 'desc' },
    });

    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await this.prismaService.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        columnId: dto.columnId,
        priority: dto.priority,
        order,
      },
    });

    return task;
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
