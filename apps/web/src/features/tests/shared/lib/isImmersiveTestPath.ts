const PRACTICE_RUN_PATH = /^\/tests\/\d+\/(practice|review_wrong)$/;
const MOCK_TEST_RUN_PATH = /^\/tests\/\d+\/mock_test\/[0-9a-f-]+$/i;

export function isImmersiveTestPath(pathname: string) {
  return PRACTICE_RUN_PATH.test(pathname) || MOCK_TEST_RUN_PATH.test(pathname);
}

export function isMockTestPath(pathname: string) {
  return MOCK_TEST_RUN_PATH.test(pathname);
}
