import { isPartPracticePath } from "@/features/tests/lib/isPartPracticePath";

const FULL_TEST_ATTEMPT_PATH = /^\/tests\/\d+\/attempt\/[^/]+$/;

export function isImmersiveTestPath(pathname: string) {
  return isPartPracticePath(pathname) || FULL_TEST_ATTEMPT_PATH.test(pathname);
}
