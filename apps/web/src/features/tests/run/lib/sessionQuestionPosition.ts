type SessionQuestionGroup = {
  questions: Array<{ id: number; sessionQuestionNumber?: number | null }>;
};

export function getSessionQuestionCount(groups: SessionQuestionGroup[]) {
  return groups.reduce((total, group) => total + group.questions.length, 0);
}

export function getSessionQuestionPosition(
  groups: SessionQuestionGroup[],
  questionId: number | null | undefined,
) {
  if (questionId == null) {
    return 1;
  }

  let position = 1;

  for (const group of groups) {
    for (const question of group.questions) {
      if (question.id === questionId) {
        return position;
      }

      position += 1;
    }
  }

  return 1;
}

export function getSessionQuestionNumber(
  groups: SessionQuestionGroup[],
  questionId: number | null | undefined,
) {
  if (questionId == null) {
    return 1;
  }

  for (const group of groups) {
    for (const question of group.questions) {
      if (question.id === questionId && question.sessionQuestionNumber != null) {
        return question.sessionQuestionNumber;
      }
    }
  }

  return getSessionQuestionPosition(groups, questionId);
}
