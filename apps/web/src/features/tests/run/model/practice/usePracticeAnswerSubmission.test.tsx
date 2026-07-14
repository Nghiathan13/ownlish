import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OptionKey } from "@/features/tests/run/lib/answerKeyMap";
import {
  type PracticeAnswerSubmission,
  usePracticeAnswerSubmission,
} from "@/features/tests/run/model/practice/usePracticeAnswerSubmission";

type SubmitResult = {
  savedKey: OptionKey;
};

describe("usePracticeAnswerSubmission", () => {
  it("runs one session queue and coalesces changes to the active question", async () => {
    const firstResponse = Promise.withResolvers<void>();
    const secondResponse = Promise.withResolvers<void>();
    const thirdResponse = Promise.withResolvers<void>();
    const responses = [firstResponse, secondResponse, thirdResponse];
    const submissions: PracticeAnswerSubmission[] = [];

    const submit = vi.fn(async (submission: PracticeAnswerSubmission) => {
      const response = responses[submissions.length];
      submissions.push(submission);
      await response.promise;
      return { savedKey: submission.selectedKey } satisfies SubmitResult;
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      usePracticeAnswerSubmission({ submit, onSuccess }),
    );

    act(() => {
      result.current.queueAnswer(101, "A");
    });
    await waitFor(() =>
      expect(submissions).toEqual([
        { toeicQuestionId: 101, selectedKey: "A" },
      ]),
    );

    act(() => {
      result.current.queueAnswer(202, "C");
      result.current.queueAnswer(101, "B");
      result.current.queueAnswer(101, "D");
    });

    expect(submissions).toHaveLength(1);
    expect(result.current.isQuestionPending(101)).toBe(true);
    expect(result.current.isQuestionPending(202)).toBe(true);

    act(() => {
      firstResponse.resolve();
    });
    await waitFor(() =>
      expect(submissions).toEqual([
        { toeicQuestionId: 101, selectedKey: "A" },
        { toeicQuestionId: 101, selectedKey: "D" },
      ]),
    );

    expect(result.current.isQuestionPending(101)).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      secondResponse.resolve();
    });
    await waitFor(() =>
      expect(submissions).toEqual([
        { toeicQuestionId: 101, selectedKey: "A" },
        { toeicQuestionId: 101, selectedKey: "D" },
        { toeicQuestionId: 202, selectedKey: "C" },
      ]),
    );
    await waitFor(() =>
      expect(result.current.isQuestionPending(101)).toBe(false),
    );
    expect(result.current.isQuestionPending(202)).toBe(true);

    act(() => {
      thirdResponse.resolve();
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(result.current.isQuestionPending(101)).toBe(false);
    expect(result.current.isQuestionPending(202)).toBe(false);
    expect(result.current.hasSyncFailures).toBe(false);
    expect(onSuccess.mock.calls.map(([, submission]) => submission)).toEqual([
      { toeicQuestionId: 101, selectedKey: "D" },
      { toeicQuestionId: 202, selectedKey: "C" },
    ]);
  });

  it("stops on the latest failure and retries the retained desired answer", async () => {
    const staleFailure = Promise.withResolvers<void>();
    const latestFailure = Promise.withResolvers<void>();
    const retryResponse = Promise.withResolvers<void>();
    const queuedResponse = Promise.withResolvers<void>();
    const responses = [
      staleFailure,
      latestFailure,
      retryResponse,
      queuedResponse,
    ];
    const submissions: PracticeAnswerSubmission[] = [];

    const submit = vi.fn(async (submission: PracticeAnswerSubmission) => {
      const response = responses[submissions.length];
      submissions.push(submission);
      await response.promise;
      return { savedKey: submission.selectedKey } satisfies SubmitResult;
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      usePracticeAnswerSubmission({ submit, onSuccess }),
    );

    act(() => {
      result.current.queueAnswer(101, "A");
    });
    await waitFor(() => expect(submissions).toHaveLength(1));

    act(() => {
      result.current.queueAnswer(101, "B");
      result.current.queueAnswer(202, "C");
      staleFailure.reject(new Error("stale request failed"));
    });

    await waitFor(() =>
      expect(submissions).toEqual([
        { toeicQuestionId: 101, selectedKey: "A" },
        { toeicQuestionId: 101, selectedKey: "B" },
      ]),
    );
    expect(result.current.hasSyncFailures).toBe(false);

    act(() => {
      latestFailure.reject(new Error("latest request failed"));
    });
    await waitFor(() => expect(result.current.hasSyncFailures).toBe(true));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(submissions).toHaveLength(2);
    expect(result.current.isQuestionSyncFailed(101)).toBe(true);
    expect(result.current.isQuestionPending(101)).toBe(false);
    expect(result.current.isQuestionPending(202)).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      result.current.retryFailedAnswers();
    });
    await waitFor(() =>
      expect(submissions[2]).toEqual({
        toeicQuestionId: 101,
        selectedKey: "B",
      }),
    );
    expect(result.current.hasSyncFailures).toBe(false);
    expect(result.current.isQuestionPending(101)).toBe(true);

    act(() => {
      retryResponse.resolve();
    });
    await waitFor(() =>
      expect(submissions[3]).toEqual({
        toeicQuestionId: 202,
        selectedKey: "C",
      }),
    );

    act(() => {
      queuedResponse.resolve();
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(result.current.isQuestionPending(101)).toBe(false);
    expect(result.current.isQuestionPending(202)).toBe(false);
    expect(result.current.hasSyncFailures).toBe(false);
    expect(onSuccess.mock.calls.map(([, submission]) => submission)).toEqual([
      { toeicQuestionId: 101, selectedKey: "B" },
      { toeicQuestionId: 202, selectedKey: "C" },
    ]);
  });
});
