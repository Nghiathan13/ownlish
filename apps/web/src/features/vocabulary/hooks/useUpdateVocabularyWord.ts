import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  updateVocabWord,
  type UpdateVocabWordInput,
  type VocabWord,
  type VocabWordListResponse,
} from "@/entities/vocab/api/vocab";
import { invalidateVocabMutationQueries } from "@/entities/vocab/lib/vocabCache";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

type UpdateVocabularyWordVariables = {
  wordToUpdate: VocabWord;
  input: UpdateVocabWordInput;
};

type UseUpdateVocabularyWordParams = {
  accessToken: string | null;
  clearSession: () => void;
  queryClient: QueryClient;
  queryKey: QueryKey;
  userId: string | null;
};

export function useUpdateVocabularyWord({
  accessToken,
  clearSession,
  queryClient,
  queryKey,
  userId,
}: UseUpdateVocabularyWordParams) {
  const {
    mutateAsync: updateWordMutation,
    isPending: isUpdatingWord,
    variables: updateMutationVariables,
  } = useMutation({
    mutationFn: ({ wordToUpdate, input }: UpdateVocabularyWordVariables) => {
      return runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => updateVocabWord(token, wordToUpdate.id, input),
      });
    },
    onMutate: async ({ wordToUpdate, input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((word) =>
            word.id === wordToUpdate.id ? { ...word, ...input } : word,
          ),
        };
      });

      return { previousVocab, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousVocab && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousVocab);
      }
    },
    onSuccess: (updatedWord) => {
      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((word) =>
            word.id === updatedWord.id ? updatedWord : word,
          ),
        };
      });
    },
    onSettled: () => {
      invalidateVocabMutationQueries(queryClient, userId);
    },
  });

  const updateWord = useCallback(
    async (wordToUpdate: VocabWord, input: UpdateVocabWordInput) => {
      await updateWordMutation({ wordToUpdate, input });
    },
    [updateWordMutation],
  );

  return {
    isUpdatingWord,
    updateWord,
    updatingWordId: isUpdatingWord
      ? updateMutationVariables?.wordToUpdate.id ?? null
      : null,
  };
}
