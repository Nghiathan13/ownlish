import { Injectable, NotFoundException } from '@nestjs/common';
import { TestsStorageService } from '../tests/tests-storage.service';
import {
  mapAdminToeicTestList,
  mapAdminToeicTestRaw,
} from './lib/toeic-test-raw.mapper';
import { ToeicTestRawRepository } from './lib/toeic-test-raw.repository';
import type {
  AdminToeicTestListResponse,
  AdminToeicTestRawResponse,
} from './lib/toeic-test-raw.types';

@Injectable()
export class AdminToeicTestService {
  constructor(
    private readonly repository: ToeicTestRawRepository,
    private readonly storageService: TestsStorageService,
  ) {}

  async listTests(): Promise<AdminToeicTestListResponse> {
    const tests = await this.repository.findTests();
    return mapAdminToeicTestList(tests);
  }

  async getRawTest(testId: number): Promise<AdminToeicTestRawResponse> {
    const test = await this.repository.findTestById(testId);

    if (!test) {
      throw new NotFoundException('TOEIC test not found');
    }

    return mapAdminToeicTestRaw(test, this.storageService);
  }
}
