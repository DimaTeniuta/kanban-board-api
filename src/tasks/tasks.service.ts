import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { BoardsService } from '@/boards/boards.service';
import { ColumnsService } from '@/columns/columns.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskOrderDto } from './dto/update-task-order.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prismaService: PrismaService,
    private boardsService: BoardsService,
    private columnsService: ColumnsService,
  ) {}

  public async getAll(boardId: string, columnId: string, userId: string) {
    await this.boardsService.findBoard(boardId, userId);
    await this.columnsService.findColumn(columnId, boardId);

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
    await this.boardsService.findBoard(boardId, userId);
    await this.columnsService.findColumn(columnId, boardId);
    const task = await this.findTask(columnId, taskId);

    return task;
  }

  public async create(dto: CreateTaskDto, boardId: string, columnId: string, userId: string) {
    await this.boardsService.findBoard(boardId, userId);
    await this.columnsService.findColumn(columnId, boardId);

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
    await this.boardsService.findBoard(boardId, userId);
    await this.columnsService.findColumn(columnId, boardId);
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
    await this.boardsService.findBoard(boardId, userId);
    await this.columnsService.findColumn(columnId, boardId);
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

  public async updateOrder(
    dto: UpdateTaskOrderDto,
    boardId: string,
    columnId: string,
    taskId: string,
    userId: string,
  ) {
    await this.boardsService.findBoard(boardId, userId);
    await this.columnsService.findColumn(columnId, boardId);
    const task = await this.findTask(columnId, taskId);

    const isSameColumn = task.columnId === dto.newColumnId;

    if (!isSameColumn) {
      await this.columnsService.findColumn(dto.newColumnId, boardId);
    }

    if (dto.newOrder < 0) {
      throw new BadRequestException('Invalid order value');
    }

    const updates: Promise<any>[] = [];

    if (isSameColumn) {
      const tasks = await this.prismaService.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });

      const currentOrder = task.order;
      const newOrder = dto.newOrder;

      if (newOrder >= tasks.length) {
        throw new BadRequestException('Invalid order value');
      }

      if (newOrder > currentOrder) {
        for (const t of tasks) {
          if (t.order > currentOrder && t.order <= newOrder) {
            updates.push(
              this.prismaService.task.update({
                where: { id: t.id },
                data: { order: t.order - 1 },
              }),
            );
          }
        }
      } else if (newOrder < currentOrder) {
        for (const t of tasks) {
          if (t.order >= newOrder && t.order < currentOrder) {
            updates.push(
              this.prismaService.task.update({
                where: { id: t.id },
                data: { order: t.order + 1 },
              }),
            );
          }
        }
      }

      updates.push(
        this.prismaService.task.update({
          where: { id: task.id },
          data: { order: newOrder },
        }),
      );
    } else {
      // Moving to another column
      const targetTasks = await this.prismaService.task.findMany({
        where: { columnId: dto.newColumnId },
        orderBy: { order: 'asc' },
      });

      if (dto.newOrder > targetTasks.length) {
        throw new BadRequestException('Invalid order value');
      }

      // Change order of tasks in the new column
      for (const t of targetTasks) {
        if (t.order >= dto.newOrder) {
          updates.push(
            this.prismaService.task.update({
              where: { id: t.id },
              data: { order: t.order + 1 },
            }),
          );
        }
      }

      // Change order of tasks in the old column
      const oldTasks = await this.prismaService.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });

      for (const t of oldTasks) {
        if (t.order > task.order) {
          updates.push(
            this.prismaService.task.update({
              where: { id: t.id },
              data: { order: t.order - 1 },
            }),
          );
        }
      }

      // Update the task itself
      updates.push(
        this.prismaService.task.update({
          where: { id: task.id },
          data: {
            columnId: dto.newColumnId,
            order: dto.newOrder,
          },
        }),
      );
    }

    await Promise.all(updates);

    const taskWitnhNewOrder = await this.prismaService.task.findUnique({
      where: {
        id: taskId,
      },
    });

    return taskWitnhNewOrder;
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
}
