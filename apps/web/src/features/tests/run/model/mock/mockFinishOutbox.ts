export type MockFinishCommand = {
  type: "finish_mock";
  sessionId: string;
};

export function getMockFinishOutboxStorageKey(sessionId: string) {
  return `engvocab.mockFinish.${sessionId}`;
}

export function readMockFinishCommand(
  sessionId: string,
): MockFinishCommand | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(
    getMockFinishOutboxStorageKey(sessionId),
  );
  if (!raw) {
    return null;
  }

  try {
    const command = JSON.parse(raw) as Partial<MockFinishCommand>;
    return command.type === "finish_mock" && command.sessionId === sessionId
      ? { type: "finish_mock", sessionId }
      : null;
  } catch {
    return null;
  }
}

export function storeMockFinishCommand(sessionId: string) {
  const command: MockFinishCommand = {
    type: "finish_mock",
    sessionId,
  };

  window.localStorage.setItem(
    getMockFinishOutboxStorageKey(sessionId),
    JSON.stringify(command),
  );
}

export function removeMockFinishCommand(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getMockFinishOutboxStorageKey(sessionId));
}
