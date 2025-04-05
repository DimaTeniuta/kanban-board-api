import { Body, Controller, Get, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResult, TasksResult } from './results/task.result';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':boardId/:columnId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get all Tasks by Column ID',
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

  @Get(':boardId/:columnId/:taskId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get all Tasks by Column ID',
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
  public async create(@Req() req: Request, @Body() body: CreateTaskDto) {
    const task = await this.tasksService.create(body, req.user.userId);

    return task;
  }
}
