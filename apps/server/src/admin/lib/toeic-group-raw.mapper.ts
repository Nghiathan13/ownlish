import type {
  ToeicQuestion,
  ToeicQuestionGroup,
  ToeicTestPart,
} from '@prisma/client';
import { parseAnswerKey } from '../../tests/lib/toeic-question-mapper';
import type {
  ToeicGroupRawPayload,
  ToeicGroupRawQuestionResponse,
} from './toeic-group-raw.types';

type ToeicQuestionGroupWithRelations = ToeicQuestionGroup & {
  testPart: Pick<ToeicTestPart, 'testId' | 'partNumber'>;
  questions: ToeicQuestion[];
};

function mapQuestion(question: ToeicQuestion): ToeicGroupRawQuestionResponse {
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

export function mapToeicGroupRaw(
  group: ToeicQuestionGroupWithRelations,
): ToeicGroupRawPayload {
  return {
    group: {
      id: group.id,
      testId: group.testPart.testId,
      partNumber: group.testPart.partNumber,
      questionStart: group.questionStart,
      questionEnd: group.questionEnd,
      groupType: group.groupType,
      accent: group.accent,
      content: group.content,
      contentVi: group.contentVi,
      audioStoragePath: group.audioStoragePath,
      imageStoragePath: group.imageStoragePath,
      questions: group.questions.map(mapQuestion),
    },
  };
}
