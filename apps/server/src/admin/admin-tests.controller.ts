import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { AdminToeicQuestionService } from './admin-toeic-question.service';
import { AdminToeicTestService } from './admin-toeic-test.service';
import { PatchToeicGroupDto } from './dto/patch-toeic-group.dto';
import { PatchToeicQuestionDto } from './dto/patch-toeic-question.dto';

@Controller('admin/tests')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTestsController {
  constructor(
    private readonly adminToeicGroupService: AdminToeicGroupService,
    private readonly adminToeicQuestionService: AdminToeicQuestionService,
    private readonly adminToeicTestService: AdminToeicTestService,
  ) {}

  @Get()
  listTests() {
    return this.adminToeicTestService.listTests();
  }

  @Patch('groups/:groupId')
  patchGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: PatchToeicGroupDto,
  ) {
    return this.adminToeicGroupService.patchGroup(groupId, dto);
  }

  @Delete('groups/:groupId/audio')
  deleteGroupAudio(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.adminToeicGroupService.deleteGroupAudio(groupId);
  }

  @Post('groups/:groupId/audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadGroupAudio(
    @Param('groupId', ParseIntPipe) groupId: number,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          mimetype: string;
          originalname: string;
        }
      | undefined,
  ) {
    return this.adminToeicGroupService.uploadGroupAudio(groupId, file);
  }

  @Delete('groups/:groupId/image')
  deleteGroupImage(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.adminToeicGroupService.deleteGroupImage(groupId);
  }

  @Post('groups/:groupId/image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadGroupImage(
    @Param('groupId', ParseIntPipe) groupId: number,
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          mimetype: string;
          originalname: string;
        }
      | undefined,
  ) {
    return this.adminToeicGroupService.uploadGroupImage(groupId, file);
  }

  @Patch('questions/:questionId')
  patchQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: PatchToeicQuestionDto,
  ) {
    return this.adminToeicQuestionService.patchQuestion(questionId, dto);
  }

  @Get(':testId/raw')
  getTestRaw(@Param('testId', ParseIntPipe) testId: number) {
    return this.adminToeicTestService.getRawTest(testId);
  }
}
