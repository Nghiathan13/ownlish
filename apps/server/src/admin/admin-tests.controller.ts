import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
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

  @Delete('groups/:groupId/image')
  deleteGroupImage(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.adminToeicGroupService.deleteGroupImage(groupId);
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
