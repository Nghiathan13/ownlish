import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/types/auth.types';
import { CollectionsService } from './collections.service';
import { CatalogWordsQueryDto } from './dto/catalog-words-query.dto';
import { CreateUserCollectionDto } from './dto/create-user-collection.dto';
import { ImportCollectionDto } from './dto/import-collection.dto';
import { ImportOxfordPartDto } from './dto/import-oxford-part.dto';
import { UpdateUserCollectionDto } from './dto/update-user-collection.dto';

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

  @Get('oxford/:band/meta')
  getOxfordMeta(
    @Req() request: AuthRequest,
    @Param('band') band: string,
  ): ReturnType<CollectionsService['getOxfordMeta']> {
    return this.collectionsService.getOxfordMeta(request.user.id, band);
  }

  @Get('oxford/:band/parts/:part')
  getOxfordPart(
    @Param('band') band: string,
    @Param('part', ParseIntPipe) part: number,
  ): ReturnType<CollectionsService['getOxfordPart']> {
    return this.collectionsService.getOxfordPart(band, part);
  }

  @Post('oxford/:band/parts/:part/import')
  importOxfordPart(
    @Req() request: AuthRequest,
    @Param('band') band: string,
    @Param('part', ParseIntPipe) part: number,
    @Body() body: ImportOxfordPartDto,
  ): ReturnType<CollectionsService['importOxfordPart']> {
    return this.collectionsService.importOxfordPart(
      request.user.id,
      band,
      part,
      body.catalogDefinitionIds,
      body.targetCollectionId,
    );
  }

  @Get(':id/catalog-words')
  getCatalogWords(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: CatalogWordsQueryDto,
  ): ReturnType<CollectionsService['getCatalogWordsPage']> {
    return this.collectionsService.getCatalogWordsPage(request.user.id, id, {
      limit: query.limit,
      offset: query.offset,
    });
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
      limit: body.limit,
      offset: body.offset,
    });
  }

  @Patch(':id')
  update(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateUserCollectionDto,
  ): ReturnType<CollectionsService['updateUserCollection']> {
    return this.collectionsService.updateUserCollection(
      request.user.id,
      id,
      body,
    );
  }

  @Delete(':id')
  delete(
    @Req() request: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): ReturnType<CollectionsService['deleteUserCollection']> {
    return this.collectionsService.deleteUserCollection(request.user.id, id);
  }
}
