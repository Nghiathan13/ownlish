import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.PERFORMANCE_BASE_URL || 'http://127.0.0.1:3001';
const password = __ENV.PERFORMANCE_PASSWORD || 'performance-benchmark-password';
const emailPrefix =
  __ENV.PERFORMANCE_EMAIL_PREFIX || 'performance-benchmark-vu-';
const systemCollectionId = '10000000-0000-4000-8000-000000000001';
const systemEntryId = 'performance-oxford-a1-01';
const budgets = JSON.parse(open('./budgets.json'));
const metricDefinitions = JSON.parse(open('./metrics.json'));
const profiles = JSON.parse(open('./profiles.json'));
const profileName = __ENV.PERFORMANCE_PROFILE || 'baseline';
const profile = profiles[profileName];

if (!profile) {
  throw new Error(`Unknown performance profile: ${profileName}`);
}

const requestOk = new Rate('benchmark_request_ok');
const durations = Object.fromEntries(
  Object.keys(metricDefinitions).map((metricName) => [
    metricName,
    new Trend(metricName),
  ]),
);

export const options = {
  scenarios: {
    all_api: {
      executor: 'per-vu-iterations',
      vus: profile.vus,
      iterations: profile.iterationsPerVu,
      maxDuration: '10m',
    },
  },
  thresholds: {
    benchmark_request_ok: ['rate==1'],
    ...(profile.enforceBudgets
      ? Object.fromEntries(
          Object.entries(budgets).map(([metricName, budget]) => [
            metricName,
            [`p(95)<${budget.p95Ms}`],
          ]),
        )
      : {}),
  },
};

function json(value) {
  return JSON.stringify(value);
}

function headers(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function expectedStatus(response, expected) {
  return Array.isArray(expected)
    ? expected.includes(response.status)
    : response.status === expected;
}

function record(response, metricName, expected = 200) {
  const passed = check(response, {
    [`${metricDefinitions[metricName].label} returns expected status`]: () =>
      expectedStatus(response, expected),
  });
  requestOk.add(passed);
  durations[metricName].add(response.timings.duration);
  return response;
}

function requireJson(response, path) {
  const value = response.json(path);
  if (!value) {
    throw new Error(`Expected response field ${path}.`);
  }
  return value;
}

function getRefreshToken(response) {
  return response.cookies['engvocab.refreshToken']?.[0]?.value;
}

function benchmarkEmail(vu) {
  return `${emailPrefix}${String(vu).padStart(2, '0')}@engvocab.local`;
}

function authUserEmail(vu, iteration) {
  return `${emailPrefix}${profileName}-${String(vu).padStart(2, '0')}-auth-${String(iteration).padStart(2, '0')}@engvocab.local`;
}

function testKey(iteration) {
  return `ets26-t${String(iteration + 1).padStart(2, '0')}`;
}

function partNumber(vu) {
  return ((vu - 1) % 7) + 1;
}

function questionKey(currentTestKey, currentPartNumber) {
  return `${currentTestKey}-p${currentPartNumber}-q001`;
}

function warmUp(accessToken) {
  const authHeaders = headers(accessToken);
  const responses = http.batch([
    ['GET', `${baseUrl}/collections/oxford/A1/meta`, null, { headers: authHeaders }],
    ['GET', `${baseUrl}/collections/oxford/A1/parts/1`, null, { headers: authHeaders }],
    ['GET', `${baseUrl}/reviews/oxford/A1/parts/1`, null, { headers: authHeaders }],
    ['GET', `${baseUrl}/learning-activity/calendar`, null, { headers: authHeaders }],
  ]);

  if (responses.some((response) => response.status !== 200)) {
    throw new Error('Warm-up request failed.');
  }
}

export function setup() {
  const accessTokens = Array.from({ length: profile.vus }, (_, index) => {
    const response = http.post(
      `${baseUrl}/auth/login`,
      json({ email: benchmarkEmail(index + 1), password }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (response.status !== 201) {
      throw new Error(`Benchmark login failed for VU ${index + 1}.`);
    }
    return requireJson(response, 'accessToken');
  });

  warmUp(accessTokens[0]);
  return { accessTokens };
}

export default function ({ accessTokens }) {
  const accessToken = accessTokens[__VU - 1];
  const authHeaders = headers(accessToken);
  const currentPartNumber = partNumber(__VU);
  const currentTestKey = testKey(__ITER);
  const currentQuestionKey = questionKey(currentTestKey, currentPartNumber);
  const uniqueName = `Performance ${profileName} ${__VU}-${__ITER}`;

  record(http.get(`${baseUrl}/health`), 'api_health_duration');

  const register = record(
    http.post(
      `${baseUrl}/auth/register`,
      json({
        email: authUserEmail(__VU, __ITER),
        password,
        name: `Performance auth ${profileName} ${__VU}-${__ITER}`,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    ),
    'api_auth_register_duration',
    201,
  );
  const registeredRefreshToken = getRefreshToken(register);
  const login = record(
    http.post(
      `${baseUrl}/auth/login`,
      json({ email: authUserEmail(__VU, __ITER), password }),
      { headers: { 'Content-Type': 'application/json' } },
    ),
    'api_auth_login_duration',
    201,
  );
  const refreshToken = getRefreshToken(login) || registeredRefreshToken;
  const refreshed = record(
    http.post(
      `${baseUrl}/auth/refresh`,
      json({ refreshToken }),
      { headers: { 'Content-Type': 'application/json' } },
    ),
    'api_auth_refresh_duration',
    201,
  );
  const authUserHeaders = headers(requireJson(refreshed, 'accessToken'));
  record(http.get(`${baseUrl}/auth/me`, { headers: authUserHeaders }), 'api_auth_me_duration');
  record(
    http.patch(
      `${baseUrl}/auth/profile`,
      json({ name: `Performance profile ${__VU}-${__ITER}` }),
      { headers: authUserHeaders },
    ),
    'api_auth_profile_duration',
  );
  record(
    http.post(
      `${baseUrl}/auth/logout`,
      json({ refreshToken }),
      { headers: { 'Content-Type': 'application/json' } },
    ),
    'api_auth_logout_duration',
    201,
  );

  record(http.get(`${baseUrl}/collections`, { headers: authHeaders }), 'api_collections_list_duration');
  record(http.get(`${baseUrl}/collections/oxford/A1/meta`, { headers: authHeaders }), 'api_oxford_meta_duration');
  record(http.get(`${baseUrl}/collections/oxford/progress?band=A1`, { headers: authHeaders }), 'api_oxford_progress_duration');
  record(http.get(`${baseUrl}/collections/oxford/A1/parts/1`, { headers: authHeaders }), 'api_oxford_part_duration');
  record(
    http.get(`${baseUrl}/collections/${systemCollectionId}/catalog-words?offset=0&limit=20`, { headers: authHeaders }),
    'api_collection_catalog_duration',
  );
  record(http.get(`${baseUrl}/collections/${systemCollectionId}`, { headers: authHeaders }), 'api_collection_get_duration');

  const collection = record(
    http.post(
      `${baseUrl}/collections`,
      json({ name: uniqueName, description: 'Performance benchmark collection' }),
      { headers: authHeaders },
    ),
    'api_collections_create_duration',
    201,
  );
  const collectionId = requireJson(collection, 'id');
  record(
    http.post(
      `${baseUrl}/collections/oxford/A1/parts/1/import`,
      json({ catalogDefinitionIds: [systemEntryId], targetCollectionId: collectionId }),
      { headers: authHeaders },
    ),
    'api_oxford_import_duration',
    201,
  );
  record(
    http.post(
      `${baseUrl}/collections/${systemCollectionId}/import`,
      json({ catalogDefinitionIds: [systemEntryId], targetCollectionId: collectionId }),
      { headers: authHeaders },
    ),
    'api_collection_import_duration',
    201,
  );
  record(
    http.patch(
      `${baseUrl}/collections/${collectionId}`,
      json({ name: `${uniqueName} updated`, description: 'Updated benchmark collection' }),
      { headers: authHeaders },
    ),
    'api_collection_update_duration',
  );

  const vocab = record(
    http.post(
      `${baseUrl}/vocab`,
      json({
        collectionId,
        word: `Benchmark word ${__VU}-${__ITER}`,
        meaningVi: 'Từ benchmark',
      }),
      { headers: authHeaders },
    ),
    'api_vocab_create_duration',
    201,
  );
  const vocabId = requireJson(vocab, 'id');
  record(http.get(`${baseUrl}/vocab?collectionId=${collectionId}&limit=20&offset=0`, { headers: authHeaders }), 'api_vocab_list_duration');
  record(http.get(`${baseUrl}/vocab/stats?collectionId=${collectionId}`, { headers: authHeaders }), 'api_vocab_stats_duration');
  record(http.get(`${baseUrl}/vocab/review/due?collectionId=${collectionId}&limit=20&offset=0`, { headers: authHeaders }), 'api_vocab_due_duration');
  record(http.get(`${baseUrl}/vocab/${vocabId}`, { headers: authHeaders }), 'api_vocab_get_duration');
  record(
    http.patch(`${baseUrl}/vocab/${vocabId}/review`, json({ rating: 'GOOD' }), { headers: authHeaders }),
    'api_vocab_review_duration',
  );
  record(
    http.patch(`${baseUrl}/vocab/${vocabId}`, json({ meaningVi: 'Từ benchmark đã cập nhật' }), { headers: authHeaders }),
    'api_vocab_update_duration',
  );
  record(http.del(`${baseUrl}/vocab/${vocabId}`, null, { headers: authHeaders }), 'api_vocab_delete_duration');

  record(http.get(`${baseUrl}/reviews/difficult-words`, { headers: authHeaders }), 'api_review_difficult_duration');
  record(http.get(`${baseUrl}/reviews/oxford/A1/parts/1`, { headers: authHeaders }), 'api_review_part_duration');
  record(
    http.post(
      `${baseUrl}/reviews/oxford/A1/parts/1/definitions/${systemEntryId}/grade`,
      json({ rating: 'FORGET' }),
      { headers: authHeaders },
    ),
    'api_review_grade_duration',
    201,
  );

  const videoId = `performance-${profileName}-video-${__VU}-${__ITER}`;
  record(http.get(`${baseUrl}/dictation/videos/${videoId}/progress`, { headers: authHeaders }), 'api_dictation_progress_duration');
  record(
    http.post(`${baseUrl}/dictation/videos/${videoId}/answers`, json({ segmentId: 's001', isCompleted: false }), { headers: authHeaders }),
    'api_dictation_answer_duration',
    201,
  );
  record(http.del(`${baseUrl}/dictation/videos/${videoId}/progress`, null, { headers: authHeaders }), 'api_dictation_reset_duration');

  const testRun = record(
    http.post(
      `${baseUrl}/tests/runtime/test-runs`,
      json({ testKey: currentTestKey, partNumbers: [currentPartNumber], mode: 'practice' }),
      { headers: authHeaders },
    ),
    'api_toeic_test_run_duration',
    201,
  );
  const testRunId = requireJson(testRun, 'sessionId');
  const partRun = record(
    http.post(`${baseUrl}/tests/runtime/part-practice-runs`, json({ partNumber: currentPartNumber }), { headers: authHeaders }),
    'api_toeic_part_run_duration',
    201,
  );
  const partRunId = requireJson(partRun, 'sessionId');
  record(
    http.post(`${baseUrl}/tests/runtime/mock-runs/prepare`, json({ testKey: currentTestKey, partNumbers: [currentPartNumber] }), { headers: authHeaders }),
    'api_toeic_mock_prepare_duration',
    201,
  );
  const mockRun = record(
    http.post(`${baseUrl}/tests/runtime/mock-runs/restart`, json({ testKey: currentTestKey, partNumbers: [currentPartNumber], timeLimitMinutes: 1 }), { headers: authHeaders }),
    'api_toeic_mock_restart_duration',
    201,
  );
  const mockRunId = requireJson(mockRun, 'sessionId');
  record(http.get(`${baseUrl}/tests/runtime/test-practice-runs`, { headers: authHeaders }), 'api_toeic_test_practice_list_duration');
  record(http.get(`${baseUrl}/tests/runtime/mock-runs/${currentTestKey}`, { headers: authHeaders }), 'api_toeic_mock_list_duration');
  record(http.get(`${baseUrl}/tests/runtime/part-practice-runs`, { headers: authHeaders }), 'api_toeic_part_practice_list_duration');
  record(http.get(`${baseUrl}/tests/runtime/runs/${testRunId}`, { headers: authHeaders }), 'api_toeic_run_get_duration');
  record(http.get(`${baseUrl}/tests/runtime/runs/${partRunId}`, { headers: authHeaders }), 'api_toeic_run_get_duration');
  record(
    http.post(`${baseUrl}/tests/runtime/runs/${testRunId}/answers`, json({ questionKey: currentQuestionKey, selectedKey: 'A' }), { headers: authHeaders }),
    'api_toeic_answer_duration',
    201,
  );
  record(
    http.patch(`${baseUrl}/tests/runtime/runs/${mockRunId}/timer`, json({ remainingSeconds: 30 }), { headers: authHeaders }),
    'api_toeic_timer_duration',
  );
  record(
    http.patch(`${baseUrl}/tests/runtime/runs/${mockRunId}/finish`, null, { headers: authHeaders }),
    'api_toeic_finish_duration',
    [200, 202],
  );
  record(http.del(`${baseUrl}/tests/runtime/test-practice-runs/${currentTestKey}`, null, { headers: authHeaders }), 'api_toeic_test_practice_clear_duration');
  record(http.del(`${baseUrl}/tests/runtime/part-practice-runs/${currentPartNumber}`, null, { headers: authHeaders }), 'api_toeic_part_practice_clear_duration');

  record(http.get(`${baseUrl}/learning-activity/calendar`, { headers: authHeaders }), 'api_activity_calendar_duration');
  record(
    http.post(
      `${baseUrl}/learning-activity/checkpoints`,
      json({ activityType: 'VOCABULARY_REVIEW', kind: 'heartbeat', elapsedSeconds: 60 }),
      { headers: authHeaders },
    ),
    'api_activity_checkpoint_duration',
    201,
  );

  record(http.del(`${baseUrl}/collections/${collectionId}`, null, { headers: authHeaders }), 'api_collection_delete_duration');
}

export function handleSummary(data) {
  delete data.setup_data;
  const summaryPath = `test-results/performance/k6-${profileName}-summary.json`;

  return {
    [summaryPath]: JSON.stringify(data),
  };
}
