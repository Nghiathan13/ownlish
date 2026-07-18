"use client";

import { useRuntimeTestSessionQuery } from "@/entities/toeic-runtime/model/useRuntimeTestSessionQuery";

export type UseMockRunQueryParams = {
  sessionId: string;
  enabled?: boolean;
};

export function useMockRunQuery({
  sessionId,
  enabled = true,
}: UseMockRunQueryParams) {
  return useRuntimeTestSessionQuery({
    sessionId,
    mode: "mock_test",
    enabled,
  });
}
