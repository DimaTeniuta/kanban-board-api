import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateColumnOrderDto } from './dto/update-column-order.dto';
import { ColumnResult, ColumnsResult } from './results/column.result';
import { DeleteColumnResult } from './results/delete.result';

@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get(':boardId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get all Columns by Board ID',
    status: HttpStatus.OK,
    type: ColumnsResult,
  })
  public async getAll(@Param('boardId') boardId: string, @Req() req: Request) {
    const columns = await this.columnsService.getAll(boardId, req.user.userId);

    return { columns };
  }

  @Get(':boardId/:columnId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get all Columns by Board ID',
    status: HttpStatus.OK,
    type: ColumnResult,
  })
  public async getById(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Req() req: Request,
  ) {
    const column = await this.columnsService.getById(boardId, columnId, req.user.userId);

    return column;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Create Column',
    status: HttpStatus.OK,
    type: ColumnResult,
  })
  public async create(@Req() req: Request, @Body() body: CreateColumnDto) {
    const board = await this.columnsService.create(body, req.user.userId);

    return board;
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Update Column',
    status: HttpStatus.OK,
    type: ColumnResult,
  })
  public async update(@Req() req: Request, @Body() body: UpdateColumnDto) {
    const column = await this.columnsService.update(body, req.user.userId);

    return column;
  }

  @Delete(':boardId/:columnId')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Delete Column',
    status: HttpStatus.OK,
    type: DeleteColumnResult,
  })
  public async delete(
    @Req() req: Request,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
  ) {
    const result = await this.columnsService.delete(boardId, columnId, req.user.userId);

    return result;
  }

  @Patch('order')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Update column order',
    status: HttpStatus.OK,
    type: ColumnsResult,
  })
  public async updateOrder(@Req() req: Request, @Body() body: UpdateColumnOrderDto) {
    const columns = await this.columnsService.updateOrder(body, req.user.userId);

    return { columns };
  }
}
