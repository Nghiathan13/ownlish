export const activeDefinitionsInclude = {
  definitions: {
    where: {
      deletedAt: null,
    },
    orderBy: [
      { source: 'asc' as const },
      { type: 'asc' as const },
      { createdAt: 'asc' as const },
    ],
  },
};

export const reviewDefinitionInclude = {
  vocabWord: true,
};
