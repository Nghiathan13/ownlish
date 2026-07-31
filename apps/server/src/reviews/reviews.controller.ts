import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { GradeOxfordWordDto } from './dto/grade-oxford-word.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('difficult-words')
  listDifficultWords(
    @Req() request: AuthRequest,
  ): ReturnType<ReviewsService['listDifficultWords']> {
    return this.reviewsService.listDifficultWords(request.user.id);
  }

  @Get('oxford/:band/parts/:part')
  getOxfordPart(
    @Req() request: AuthRequest,
    @Param('band') band: string,
    @Param('part', ParseIntPipe) part: number,
  ): ReturnType<ReviewsService['getOxfordPart']> {
    return this.reviewsService.getOxfordPart(request.user.id, band, part);
  }

  @Post('oxford/:band/parts/:part/definitions/:definitionId/grade')
  gradeOxfordDefinition(
    @Req() request: AuthRequest,
    @Param('band') band: string,
    @Param('part', ParseIntPipe) part: number,
    @Param('definitionId') definitionId: string,
    @Body() body: GradeOxfordWordDto,
  ): ReturnType<ReviewsService['gradeOxfordDefinition']> {
    return this.reviewsService.gradeOxfordDefinition(
      request.user.id,
      band,
      part,
      definitionId,
      body.rating,
    );
  }
}
