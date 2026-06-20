const PRACTICE_RUN_PATH = /^\/tests\/\d+\/(practice|review_wrong)$/;

export function isImmersiveTestPath(pathname: string) {
  return PRACTICE_RUN_PATH.test(pathname);
}
