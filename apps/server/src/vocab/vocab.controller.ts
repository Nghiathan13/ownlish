import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { CreateVocabWordDto } from './dto/create-vocab-word.dto';
import { ListDueReviewWordsDto } from './dto/list-due-review-words.dto';
import { ListVocabWordsDto } from './dto/list-vocab-words.dto';
import { UpdateVocabWordDto } from './dto/update-vocab-word.dto';
import { UpdateVocabReviewDto } from './dto/update-vocab-review.dto';
import { VocabStatsService } from './vocab-stats.service';
import { VocabService } from './vocab.service';

@Controller('vocab')
@UseGuards(JwtAuthGuard)
export class VocabController {
  constructor(
    private readonly vocabService: VocabService,
    private readonly vocabStatsService: VocabStatsService,
  ) {}

  @Get()
  list(
    @Req() request: AuthRequest,
    @Query() query: ListVocabWordsDto,
  ): ReturnType<VocabService['list']> {
    return this.vocabService.list(request.user.id, query);
  }

  @Get('stats')
  getStats(
    @Req() request: AuthRequest,
  ): ReturnType<VocabStatsService['getStats']> {
    return this.vocabStatsService.getStats(request.user.id);
  }

  @Get('review/due')
  listDueReviewWords(
    @Req() request: AuthRequest,
    @Query() query: ListDueReviewWordsDto,
  ): ReturnType<VocabService['listDueReviewWords']> {
    return this.vocabService.listDueReviewWords(request.user.id, query);
  }

  @Get(':id')
  get(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<VocabService['get']> {
    return this.vocabService.get(request.user.id, id);
  }

  @Post()
  create(
    @Req() request: AuthRequest,
    @Body() dto: CreateVocabWordDto,
  ): ReturnType<VocabService['create']> {
    return this.vocabService.create(request.user.id, dto);
  }

  @Patch(':id/review')
  updateReview(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateVocabReviewDto,
  ): ReturnType<VocabService['updateReview']> {
    return this.vocabService.updateReview(request.user.id, id, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateVocabWordDto,
  ): ReturnType<VocabService['update']> {
    return this.vocabService.update(request.user.id, id, dto);
  }

  @Delete('definitions/:id')
  softDeleteDefinition(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<VocabService['softDeleteDefinition']> {
    return this.vocabService.softDeleteDefinition(request.user.id, id);
  }

  @Delete(':id')
  softDelete(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<VocabService['softDelete']> {
    return this.vocabService.softDelete(request.user.id, id);
  }
}
