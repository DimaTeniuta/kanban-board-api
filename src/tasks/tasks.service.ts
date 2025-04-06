import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
    const task = await this.findTask(columnId, taskId);

    return task;
  }

  public async create(dto: CreateTaskDto, boardId: string, columnId: string, userId: string) {
    await this.findBoard(boardId, userId);
    await this.findColumn(columnId, boardId);

    const maxOrderTask = await this.prismaService.task.findFirst({
      where: { columnId: columnId },
      orderBy: { order: 'desc' },
    });

    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await this.prismaService.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        columnId: columnId,
        priority: dto.priority,
        order,
      },
    });

    return task;
  }

  public async update(
    dto: UpdateTaskDto,
    boardId: string,
    columnId: string,
    taskId: string,
    userId: string,
  ) {
    await this.findBoard(boardId, userId);
    await this.findColumn(columnId, boardId);
    const task = await this.findTask(columnId, taskId);

    const updatedTask = await this.prismaService.task.update({
      where: { id: taskId },
      data: {
        title: dto.title ?? task.title,
        description: dto.description ?? task.description,
        priority: dto.priority ?? task.priority,
      },
    });

    return updatedTask;
  }

  public async delete(boardId: string, columnId: string, taskId: string, userId: string) {
    await this.findBoard(boardId, userId);
    await this.findColumn(columnId, boardId);
    await this.findTask(columnId, taskId);

    await this.prismaService.task.delete({
      where: {
        id: taskId,
        columnId,
      },
    });

    const tasks = await this.prismaService.task.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
    });

    const updates: Promise<any>[] = [];

    for (let i = 0; i < tasks.length; i++) {
      updates.push(
        this.prismaService.task.update({
          where: { id: tasks[i].id },
          data: { order: i },
        }),
      );
    }

    await Promise.all(updates);

    return {
      message: 'Task has been successfully deleted.',
    };
  }

  private async findTask(columnId: string, taskId: string) {
    const task = await this.prismaService.task.findUnique({
      where: {
        id: taskId,
        columnId,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
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
