import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { CollectionsService } from './collections.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  list(@Req() request: AuthRequest): ReturnType<CollectionsService['list']> {
    return this.collectionsService.list(request.user.id);
  }

  @Get(':id')
  get(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<CollectionsService['get']> {
    return this.collectionsService.get(request.user.id, id);
  }

  @Post(':id/import')
  importToVocabulary(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<CollectionsService['importToVocabulary']> {
    return this.collectionsService.importToVocabulary(request.user.id, id);
  }
}
