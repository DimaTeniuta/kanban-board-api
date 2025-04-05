import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardResult, BoardsResult } from './results/board.result';
import { DeleteBoardResult } from './results/delete.result';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get All User Boards',
    type: BoardsResult,
  })
  public async getAll(@Req() req: Request) {
    const boards = await this.boardsService.getAll(req.user.userId);

    return { boards };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Get Board',
    type: BoardResult,
  })
  public async getById(@Param('id') boatdId: string, @Req() req: Request) {
    const board = await this.boardsService.getById(boatdId, req.user.userId);

    return board;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Create Board',
    status: HttpStatus.OK,
    type: BoardResult,
  })
  public async create(@Req() req: Request, @Body() body: CreateBoardDto) {
    const board = await this.boardsService.create(body, req.user.userId);

    return board;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Update Board',
    status: HttpStatus.OK,
    type: BoardResult,
  })
  public async update(
    @Param('id') boatdId: string,
    @Req() req: Request,
    @Body() body: UpdateBoardDto,
  ) {
    const board = await this.boardsService.update(body, boatdId, req.user.userId);

    return board;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    description: 'Delete Board',
    status: HttpStatus.OK,
    type: DeleteBoardResult,
  })
  public async delete(@Param('id') boatdId: string, @Req() req: Request) {
    const board = await this.boardsService.delete(boatdId, req.user.userId);

    return board;
  }
}
