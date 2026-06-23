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
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    toeicRunQuestion: {
      count: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    toeicRunGroup: {
      create: jest.fn(),
      update: jest.fn(),
    },
    toeicQuestion: {
      findUnique: jest.fn(),
    },
    toeicQuestionGroup: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

export type ToeicTestsPrismaMock = ReturnType<typeof createToeicTestsPrismaMock>;

export function useToeicTestsTransaction(prismaMock: ToeicTestsPrismaMock) {
  prismaMock.$transaction.mockImplementation(
    (callback: (tx: ToeicTestsPrismaMock) => unknown) => callback(prismaMock),
  );
}
