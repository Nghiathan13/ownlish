import { isPartPracticeRunPath } from "@/features/tests/shared/lib/partPracticePaths";

const TOEIC_RUN_PATH =
  /^\/tests\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/(practice|review_wrong|mock_test)$/i;

export function isImmersiveTestPath(pathname: string) {
  return TOEIC_RUN_PATH.test(pathname) || isPartPracticeRunPath(pathname);
}

export function isMockTestPath(pathname: string) {
  return /\/mock_test$/.test(pathname);
}
