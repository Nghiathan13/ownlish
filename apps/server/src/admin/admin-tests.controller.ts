import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminToeicGroupService } from './admin-toeic-group.service';
import { PatchToeicGroupRawDto } from './dto/patch-toeic-group-raw.dto';

@Controller('admin/tests')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTestsController {
  constructor(
    private readonly adminToeicGroupService: AdminToeicGroupService,
  ) {}

  @Get('groups/:groupId/raw')
  getGroupRaw(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.adminToeicGroupService.getRawGroup(groupId);
  }

  @Patch('groups/:groupId/raw')
  patchGroupRaw(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: PatchToeicGroupRawDto,
  ) {
    return this.adminToeicGroupService.patchRawGroup(groupId, dto);
  }
}
