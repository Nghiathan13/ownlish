type MockWithCalls = {
  mock: {
    calls: unknown[][];
  };
};

export function getMockCallArg<T>(
  mockFn: MockWithCalls,
  callIndex = 0,
  argIndex = 0,
): T {
  const call = mockFn.mock.calls[callIndex]?.[argIndex];
  if (call === undefined) {
    throw new Error('Mock was not called with the expected arguments');
  }

  return call as T;
}
