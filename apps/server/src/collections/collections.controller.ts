import {
  Body,
  Controller,
  Delete,
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
import { CreateUserCollectionDto } from './dto/create-user-collection.dto';
import { ImportCollectionDto } from './dto/import-collection.dto';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  list(@Req() request: AuthRequest): ReturnType<CollectionsService['list']> {
    return this.collectionsService.list(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthRequest,
    @Body() body: CreateUserCollectionDto,
  ): ReturnType<CollectionsService['createUserCollection']> {
    return this.collectionsService.createUserCollection(request.user.id, body);
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
    @Body() body: ImportCollectionDto,
  ): ReturnType<CollectionsService['importToVocabulary']> {
    return this.collectionsService.importToVocabulary(request.user.id, id, {
      targetCollectionId: body.targetCollectionId,
      catalogDefinitionIds: body.catalogDefinitionIds,
    });
  }

  @Delete(':id')
  delete(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<CollectionsService['deleteUserCollection']> {
    return this.collectionsService.deleteUserCollection(request.user.id, id);
  }
}
