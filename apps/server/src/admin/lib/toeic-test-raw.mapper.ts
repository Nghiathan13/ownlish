import type { ToeicQuestion } from '@prisma/client';
import { parseAnswerKey } from '../../tests/lib/toeic-question-mapper';
import type { TestsStorageService } from '../../tests/tests-storage.service';
import type {
  AdminToeicTestListItem,
  AdminToeicTestListResponse,
  AdminToeicTestRawGroup,
  AdminToeicTestRawQuestion,
  AdminToeicTestRawResponse,
} from './toeic-test-raw.types';
import type {
  ToeicTestListRecord,
  ToeicTestRawRecord,
} from './toeic-test-raw.repository';

function mapQuestion(question: ToeicQuestion): AdminToeicTestRawQuestion {
  return {
    id: question.id,
    questionNumber: question.questionNumber,
    question: question.question,
    questionVi: question.questionVi,
    questionType: question.questionType,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    optionAVi: question.optionAVi,
    optionBVi: question.optionBVi,
    optionCVi: question.optionCVi,
    optionDVi: question.optionDVi,
    answerKey: parseAnswerKey(question.answerKey),
    explanationVi: question.explanationVi,
  };
}

export function mapAdminToeicTestList(
  tests: ToeicTestListRecord[],
): AdminToeicTestListResponse {
  return {
    items: tests.map(
      (test): AdminToeicTestListItem => ({
        id: test.id,
        year: test.year,
        testNumber: test.testNumber,
        parts: test.parts.map((part) => ({
          partNumber: part.partNumber,
          groupCount: part.groups.length,
          questionCount: part.groups.reduce(
            (total, group) => total + group._count.questions,
            0,
          ),
        })),
      }),
    ),
  };
}

export async function mapAdminToeicTestRaw(
  test: ToeicTestRawRecord,
  storageService: TestsStorageService,
): Promise<AdminToeicTestRawResponse> {
  const storagePaths = test.parts.flatMap((part) =>
    part.groups.flatMap((group) => [
      group.audioStoragePath,
      group.imageStoragePath,
    ]),
  );
  const signedUrls = await storageService.createSignedUrls(storagePaths);

  return {
    test: {
      id: test.id,
      year: test.year,
      testNumber: test.testNumber,
    },
    parts: test.parts.map((part) => ({
      partNumber: part.partNumber,
      groups: part.groups.map((group): AdminToeicTestRawGroup => {
        const audioSigned = group.audioStoragePath
          ? signedUrls.get(group.audioStoragePath)
          : null;
        const imageSigned = group.imageStoragePath
          ? signedUrls.get(group.imageStoragePath)
          : null;

        return {
          id: group.id,
          questionStart: group.questionStart,
          questionEnd: group.questionEnd,
          groupType: group.groupType,
          accent: group.accent,
          content: group.content,
          contentVi: group.contentVi,
          audioUrl: audioSigned?.url ?? null,
          audioUrlExpiresAt: audioSigned?.expiresAt ?? null,
          imageUrl: imageSigned?.url ?? null,
          imageUrlExpiresAt: imageSigned?.expiresAt ?? null,
          questions: group.questions.map(mapQuestion),
        };
      }),
    })),
  };
}
