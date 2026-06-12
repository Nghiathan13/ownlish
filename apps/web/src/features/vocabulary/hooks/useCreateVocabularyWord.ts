import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  createVocabWord,
  type CreateVocabWordInput,
  type VocabWordListResponse,
} from "@/entities/vocab/api/vocab";
import type { VocabPageState } from "@/entities/vocab/lib/vocabCache";
import { invalidateVocabMutationQueries } from "@/entities/vocab/lib/vocabCache";
import { isUnauthorizedError } from "@/shared/api/http";

type UseCreateVocabularyWordParams = {
  accessToken: string | null;
  clearSession: () => void;
  pageState: VocabPageState;
  queryClient: QueryClient;
  queryKey: QueryKey;
  resetToFirstPage: () => void;
  userId: string | null;
};

export function useCreateVocabularyWord({
  accessToken,
  clearSession,
  pageState,
  queryClient,
  queryKey,
  resetToFirstPage,
  userId,
}: UseCreateVocabularyWordParams) {
  const { mutateAsync: createWordMutation } = useMutation({
    mutationFn: (input: CreateVocabWordInput) => {
      if (!accessToken) throw new Error("No access token");
      return createVocabWord(accessToken, input);
    },
    onSuccess: (createdWord) => {
      if (pageState.offset !== 0) {
        resetToFirstPage();
      } else {
        queryClient.setQueryData<VocabWordListResponse>(
          queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              items: [createdWord, ...oldData.items],
              meta: {
                ...oldData.meta,
                total: oldData.meta.total + 1,
              },
            };
          },
        );
      }

      invalidateVocabMutationQueries(queryClient, userId);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
  });

  return useCallback(
    async (input: CreateVocabWordInput) => {
      await createWordMutation(input);
    },
    [createWordMutation],
  );
}
