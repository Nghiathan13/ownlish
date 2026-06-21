import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  createVocabWord,
  type CreateVocabWordInput,
  type VocabWordListResponse,
} from "@/entities/vocab/api/vocab";
import type { VocabPageState } from "@/entities/vocab/lib/vocabCache";
import { invalidateVocabMutationQueries } from "@/entities/vocab/lib/vocabCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

type UseCreateVocabularyWordParams = {
  pageState: VocabPageState;
  queryClient: QueryClient;
  queryKey: QueryKey;
  resetToFirstPage: () => void;
  userId: string | null;
};

export function useCreateVocabularyWord({
  pageState,
  queryClient,
  queryKey,
  resetToFirstPage,
  userId,
}: UseCreateVocabularyWordParams) {
  const { mutateAsync: createWordMutation } = useMutation({
    mutationFn: (input: CreateVocabWordInput) => {
      return runAuthenticatedRequest({
        request: (token) => createVocabWord(token, input),
      });
    },
    onSuccess: (createdWord) => {
      if (pageState.offset !== 0) {
        resetToFirstPage();
      } else {
        queryClient.setQueryData<VocabWordListResponse>(
          queryKey,
          (oldData) => {
            if (!oldData) return oldData;

            const existingIndex = oldData.items.findIndex(
              (word) => word.id === createdWord.id,
            );

            if (existingIndex >= 0) {
              return {
                ...oldData,
                items: oldData.items.map((word) =>
                  word.id === createdWord.id ? createdWord : word,
                ),
              };
            }

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

      invalidateVocabMutationQueries({
        queryClient,
        userId,
        vocabQueryKey: queryKey,
      });
    },
  });

  return useCallback(
    async (input: CreateVocabWordInput) => {
      await createWordMutation(input);
    },
    [createWordMutation],
  );
}
