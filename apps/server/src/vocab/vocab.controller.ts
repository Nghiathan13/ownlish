import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { CreateVocabWordDto } from './dto/create-vocab-word.dto';
import { UpdateVocabWordDto } from './dto/update-vocab-word.dto';
import { VocabService } from './vocab.service';

@Controller('vocab')
@UseGuards(JwtAuthGuard)
export class VocabController {
  constructor(private readonly vocabService: VocabService) {}

  @Get()
  list(@Req() request: AuthRequest) {
    return this.vocabService.list(request.user.id);
  }

  @Post()
  create(@Req() request: AuthRequest, @Body() dto: CreateVocabWordDto) {
    return this.vocabService.create(request.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateVocabWordDto,
  ) {
    return this.vocabService.update(request.user.id, id, dto);
  }

  @Delete(':id')
  softDelete(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.vocabService.softDelete(request.user.id, id);
  }
}
