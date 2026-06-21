import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  updateVocabWord,
  type UpdateVocabWordInput,
  type VocabWord,
  type VocabWordListResponse,
} from "@/entities/vocab/api/vocab";
import { invalidateVocabMutationQueries } from "@/entities/vocab/lib/vocabCache";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

type UpdateVocabularyWordVariables = {
  wordToUpdate: VocabWord;
  definitionId: string;
  input: UpdateVocabWordInput;
};

type UseUpdateVocabularyWordParams = {
  queryClient: QueryClient;
  queryKey: QueryKey;
  userId: string | null;
};

export function useUpdateVocabularyWord({
  queryClient,
  queryKey,
  userId,
}: UseUpdateVocabularyWordParams) {
  const {
    mutateAsync: updateWordMutation,
    isPending: isUpdatingWord,
    variables: updateMutationVariables,
  } = useMutation({
    mutationFn: ({
      wordToUpdate,
      definitionId,
      input,
    }: UpdateVocabularyWordVariables) => {
      return runAuthenticatedRequest({
        request: (token) =>
          updateVocabWord(token, wordToUpdate.id, {
            ...input,
            definitionId,
          }),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

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
      invalidateVocabMutationQueries({
        queryClient,
        userId,
        vocabQueryKey: queryKey,
      });
    },
  });

  const updateWord = useCallback(
    async (
      wordToUpdate: VocabWord,
      definitionId: string,
      input: UpdateVocabWordInput,
    ) => {
      await updateWordMutation({ wordToUpdate, definitionId, input });
    },
    [updateWordMutation],
  );

  return {
    isUpdatingWord,
    updateWord,
    updatingDefinitionId: isUpdatingWord
      ? updateMutationVariables?.definitionId ?? null
      : null,
    updatingWordId: isUpdatingWord
      ? updateMutationVariables?.wordToUpdate.id ?? null
      : null,
  };
}
