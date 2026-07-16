export function createToeicTestsPrismaMock() {
  return {
    toeicTest: {
      findUnique: jest.fn(),
    },
    toeicTestPart: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    toeicRun: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    toeicRunAnswer: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    toeicQuestion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    toeicQuestionGroup: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };
}

export type ToeicTestsPrismaMock = ReturnType<
  typeof createToeicTestsPrismaMock
>;

export function useToeicTestsTransaction(prismaMock: ToeicTestsPrismaMock) {
  prismaMock.$transaction.mockImplementation(
    (callback: (tx: ToeicTestsPrismaMock) => unknown) => callback(prismaMock),
  );
}
