import { useCallback } from "react";
import { useMutation, type QueryClient, type QueryKey } from "@tanstack/react-query";
import {
  deleteVocabDefinition,
  type DeleteVocabDefinitionResult,
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
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";

export type DeleteVocabularyDefinitionTarget = {
  word: VocabWord;
  definition: VocabWordDefinition;
};

type UseDeleteVocabularyDefinitionParams = {
  collectionId: string;
  moveBackOnePage: () => void;
  pageState: VocabPageState;
  queryClient: QueryClient;
  queryKey: QueryKey;
  userId: string | null;
  words: VocabWord[];
};

type DeleteMutationInput =
  | DeleteVocabularyDefinitionTarget
  | DeleteVocabularyDefinitionTarget[];

function normalizeDeleteTargets(
  input: DeleteMutationInput,
): DeleteVocabularyDefinitionTarget[] {
  return Array.isArray(input) ? input : [input];
}

function countRemovedWords(
  words: VocabWord[],
  definitionIds: ReadonlySet<string>,
) {
  return words.filter((word) => {
    const activeDefinitions = word.definitions.filter(
      (definition) => !definitionIds.has(definition.id),
    );

    return word.definitions.length > 0 && activeDefinitions.length === 0;
  }).length;
}

export function useDeleteVocabularyDefinition({
  collectionId,
  moveBackOnePage,
  pageState,
  queryClient,
  queryKey,
  userId,
  words,
}: UseDeleteVocabularyDefinitionParams) {
  const {
    mutateAsync: deleteDefinitionsMutation,
    isPending: isDeletingDefinitions,
  } = useMutation({
    mutationFn: (input: DeleteMutationInput) => {
      const targets = normalizeDeleteTargets(input);

      return Promise.all(
        targets.map((target) =>
          runAuthenticatedRequest<DeleteVocabDefinitionResult>({
            request: (token) =>
              deleteVocabDefinition(token, target.definition.id),
          }),
        ),
      );
    },
    onMutate: async (input) => {
      const targets = normalizeDeleteTargets(input);
      const definitionIds = new Set(
        targets.map((target) => target.definition.id),
      );
      const offsetAtStart = pageState.offset;
      const wordCountAtStart = words.length;
      const removedWordCount = countRemovedWords(words, definitionIds);

      await queryClient.cancelQueries({ queryKey });
      const previousVocab =
        queryClient.getQueryData<VocabWordListResponse>(queryKey);

      queryClient.setQueryData<VocabWordListResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;

        const nextItems = oldData.items
          .map((item) => ({
            ...item,
            definitions: item.definitions.filter(
              (definition) => !definitionIds.has(definition.id),
            ),
          }))
          .filter((item) => item.definitions.length > 0);

        return {
          ...oldData,
          items: nextItems,
          meta: {
            ...oldData.meta,
            total: Math.max(0, oldData.meta.total - removedWordCount),
          },
        };
      });

      const previousReviewQueues = await Promise.all(
        targets.map((target) =>
          optimisticallyRemoveFromReviewQueue(
            queryClient,
            userId,
            collectionId,
            target.definition.id,
          ),
        ),
      );

      return {
        previousVocab,
        queryKey,
        offsetAtStart,
        wordCountAtStart,
        previousReviewQueues,
        removedWordCount,
      };
    },
    onError: (_error, _input, context) => {
      if (context?.previousVocab && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousVocab);
      }

      restoreReviewQueue(
        queryClient,
        userId,
        collectionId,
        context?.previousReviewQueues[0],
      );
    },
    onSuccess: (_result, _input, context) => {
      const stillOnSamePage = pageState.offset === context?.offsetAtStart;
      const isLastWordOnPage = context?.wordCountAtStart === 1;
      const removedEntirePage =
        (context?.removedWordCount ?? 0) >= (context?.wordCountAtStart ?? 0);

      if (
        removedEntirePage &&
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
        collectionId,
        vocabQueryKey: queryKey,
      });
    },
  });

  const deleteDefinitions = useCallback(
    async (targets: DeleteVocabularyDefinitionTarget[]) => {
      if (targets.length === 0) {
        return;
      }

      await deleteDefinitionsMutation(targets);
    },
    [deleteDefinitionsMutation],
  );

  return {
    deleteDefinitions,
    isDeletingDefinitions,
  };
}
