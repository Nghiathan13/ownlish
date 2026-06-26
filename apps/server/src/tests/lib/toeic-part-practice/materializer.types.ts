export type ToeicQuestionGroupForPartPractice = {
  id: number;
  questionStart: number;
  questionEnd: number;
  testPart: {
    partNumber: number;
    testId: number;
    test: {
      year: number;
      testNumber: number;
    };
  };
  questions: Array<{
    id: number;
    questionNumber: number;
  }>;
};
