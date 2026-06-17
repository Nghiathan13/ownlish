const PART_PRACTICE_PATH = /^\/tests\/\d+\/part\/\d+$/;

export function isPartPracticePath(pathname: string) {
  return PART_PRACTICE_PATH.test(pathname);
}
