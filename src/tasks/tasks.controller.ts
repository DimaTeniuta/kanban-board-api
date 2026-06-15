import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskOrderDto } from './dto/update-task-order.dto';
import { DeleteTaskResult } from './results/delete.result';
import { TaskResult, TasksResult } from './results/task.result';
import { TasksService } from './tasks.service';

@ApiBearerAuth('access-token')
@Controller('boards/:boardId/columns/:columnId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get all Tasks By Column',
    type: TasksResult,
  })
  public async getAll(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Req() req: Request,
  ) {
    const tasks = await this.tasksService.getAll(boardId, columnId, req.user.userId);

    return { tasks };
  }

  @Get(':taskId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get one Task',
    type: TaskResult,
  })
  public async getById(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
  ) {
    const task = await this.tasksService.getById(boardId, columnId, taskId, req.user.userId);

    return task;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Create Task',
    status: HttpStatus.OK,
    type: TaskResult,
  })
  public async create(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Req() req: Request,
    @Body() body: CreateTaskDto,
  ) {
    const task = await this.tasksService.create(body, boardId, columnId, req.user.userId);

    return task;
  }

  @Patch(':taskId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Update Task',
    status: HttpStatus.OK,
    type: TaskResult,
  })
  public async update(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
    @Body() body: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(body, boardId, columnId, taskId, req.user.userId);

    return task;
  }

  @Delete(':taskId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Delete Task',
    status: HttpStatus.OK,
    type: DeleteTaskResult,
  })
  public async delete(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
  ) {
    const result = await this.tasksService.delete(boardId, columnId, taskId, req.user.userId);

    return result;
  }

  @Patch(':taskId/order')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Update Task order',
    status: HttpStatus.OK,
    type: TaskResult,
  })
  public async updateOrder(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
    @Body() body: UpdateTaskOrderDto,
  ) {
    const tasks = await this.tasksService.updateOrder(
      body,
      boardId,
      columnId,
      taskId,
      req.user.userId,
    );

    return tasks;
  }
}
