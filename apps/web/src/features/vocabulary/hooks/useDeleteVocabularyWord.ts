import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  deleteVocabWord,
  type VocabWord,
  type VocabWordListResponse,
} from "@/entities/vocab/api/vocab";
import {
  optimisticallyRemoveFromReviewQueue,
  restoreReviewQueue,
} from "@/entities/vocab/lib/reviewQueueCache";
import {
  invalidateVocabMutationQueries,
  type VocabPageState,
} from "@/entities/vocab/lib/vocabCache";
import { isUnauthorizedError } from "@/shared/api/http";

type UseDeleteVocabularyWordParams = {
  accessToken: string | null;
  clearSession: () => void;
  moveBackOnePage: () => void;
  pageState: VocabPageState;
  queryClient: QueryClient;
  queryKey: QueryKey;
  userId: string | null;
  words: VocabWord[];
};

export function useDeleteVocabularyWord({
  accessToken,
  clearSession,
  moveBackOnePage,
  pageState,
  queryClient,
  queryKey,
  userId,
  words,
}: UseDeleteVocabularyWordParams) {
  const {
    mutateAsync: deleteWordMutation,
    isPending: isDeletingWord,
    variables: deleteMutationVariables,
  } = useMutation({
    mutationFn: (wordToDelete: VocabWord) => {
      if (!accessToken) throw new Error("No access token");
      return deleteVocabWord(accessToken, wordToDelete.id);
    },
    onMutate: async (wordToDelete) => {
      const offsetAtStart = pageState.offset;
      const wordCountAtStart = words.length;
      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.filter((word) => word.id !== wordToDelete.id),
          meta: {
            ...oldData.meta,
            total: Math.max(0, oldData.meta.total - 1),
          },
        };
      });

      const previousReviewQueue = await optimisticallyRemoveFromReviewQueue(
        queryClient,
        userId,
        wordToDelete.id,
      );

      return {
        previousVocab,
        queryKey,
        offsetAtStart,
        wordCountAtStart,
        previousReviewQueue,
      };
    },
    onError: (error, wordToDelete, context) => {
      if (context?.previousVocab && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousVocab);
      }
      restoreReviewQueue(queryClient, userId, context?.previousReviewQueue);
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
    onSuccess: (_, __, context) => {
      const stillOnSamePage = pageState.offset === context?.offsetAtStart;
      const isLastItemOnPage = context?.wordCountAtStart === 1;

      if (
        isLastItemOnPage &&
        (context?.offsetAtStart ?? 0) > 0 &&
        stillOnSamePage
      ) {
        moveBackOnePage();
      }
    },
    onSettled: () => {
      invalidateVocabMutationQueries(queryClient, userId);
    },
  });

  const deleteWord = useCallback(
    async (wordToDelete: VocabWord) => {
      await deleteWordMutation(wordToDelete);
    },
    [deleteWordMutation],
  );

  return {
    deleteWord,
    deletingWordId: isDeletingWord ? deleteMutationVariables?.id ?? null : null,
  };
}
