import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  deleteVocabDefinition,
  type VocabWord,
  type VocabWordDefinition,
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
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

export type DeleteVocabularyDefinitionTarget = {
  word: VocabWord;
  definition: VocabWordDefinition;
};

type UseDeleteVocabularyDefinitionParams = {
  accessToken: string | null;
  clearSession: () => void;
  moveBackOnePage: () => void;
  pageState: VocabPageState;
  queryClient: QueryClient;
  queryKey: QueryKey;
  userId: string | null;
  words: VocabWord[];
};

export function useDeleteVocabularyDefinition({
  accessToken,
  clearSession,
  moveBackOnePage,
  pageState,
  queryClient,
  queryKey,
  userId,
  words,
}: UseDeleteVocabularyDefinitionParams) {
  const {
    mutateAsync: deleteDefinitionMutation,
    isPending: isDeletingDefinition,
    variables: deleteMutationVariables,
  } = useMutation({
    mutationFn: ({ definition }: DeleteVocabularyDefinitionTarget) => {
      return runAuthenticatedRequest({
        accessToken,
        clearSession,
        request: (token) => deleteVocabDefinition(token, definition.id),
      });
    },
    onMutate: async ({ word, definition }) => {
      const offsetAtStart = pageState.offset;
      const wordCountAtStart = words.length;
      const removesWordFromList = word.definitions.length === 1;

      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;

        const nextItems = oldData.items
          .map((item) => {
            if (item.id !== word.id) {
              return item;
            }

            const nextDefinitions = item.definitions.filter(
              (itemDefinition) => itemDefinition.id !== definition.id,
            );

            return {
              ...item,
              definitions: nextDefinitions,
            };
          })
          .filter((item) => item.definitions.length > 0);

        return {
          ...oldData,
          items: nextItems,
          meta: {
            ...oldData.meta,
            total: removesWordFromList
              ? Math.max(0, oldData.meta.total - 1)
              : oldData.meta.total,
          },
        };
      });

      const previousReviewQueue = await optimisticallyRemoveFromReviewQueue(
        queryClient,
        userId,
        definition.id,
      );

      return {
        previousVocab,
        queryKey,
        offsetAtStart,
        wordCountAtStart,
        previousReviewQueue,
        removesWordFromList,
      };
    },
    onError: (_error, _target, context) => {
      if (context?.previousVocab && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousVocab);
      }
      restoreReviewQueue(queryClient, userId, context?.previousReviewQueue);
    },
    onSuccess: (_, __, context) => {
      const stillOnSamePage = pageState.offset === context?.offsetAtStart;
      const isLastWordOnPage = context?.wordCountAtStart === 1;

      if (
        context?.removesWordFromList &&
        isLastWordOnPage &&
        (context?.offsetAtStart ?? 0) > 0 &&
        stillOnSamePage
      ) {
        moveBackOnePage();
      }
    },
    onSettled: () => {
      invalidateVocabMutationQueries({
        queryClient,
        userId,
        vocabQueryKey: queryKey,
      });
    },
  });

  const deleteDefinition = useCallback(
    async (target: DeleteVocabularyDefinitionTarget) => {
      await deleteDefinitionMutation(target);
    },
    [deleteDefinitionMutation],
  );

  return {
    deleteDefinition,
    deletingDefinitionId: isDeletingDefinition
      ? deleteMutationVariables?.definition.id ?? null
      : null,
  };
}
