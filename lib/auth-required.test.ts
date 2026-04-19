import assert from 'node:assert/strict';
import test from 'node:test';

const {
  AUTH_REQUIRED_CODE,
  isAuthRequiredResponse,
  normalizeAuthRequiredResult,
} = await import('./auth-required.ts');

import type { AuthRequiredResponsePayload } from './auth-required.ts';

test('recognizes auth-required payloads that match the shared contract', () => {
  const payload: AuthRequiredResponsePayload = {
    success: false,
    code: AUTH_REQUIRED_CODE,
    message: '请先登录',
  };

  assert.equal(isAuthRequiredResponse(payload), true);
});

test('rejects payloads that do not satisfy the full auth-required contract', () => {
  assert.equal(isAuthRequiredResponse({ code: AUTH_REQUIRED_CODE }), false);
  assert.equal(
    isAuthRequiredResponse({ success: false, code: AUTH_REQUIRED_CODE }),
    false,
  );
  assert.equal(
    isAuthRequiredResponse({ success: true, code: AUTH_REQUIRED_CODE, message: '请先登录' }),
    false,
  );
  assert.equal(
    isAuthRequiredResponse({ success: false, code: 'OTHER', message: '请先登录' }),
    false,
  );
});

test('normalizes auth-required results from plain status and payload objects', async () => {
  const payload: AuthRequiredResponsePayload = {
    success: false,
    code: AUTH_REQUIRED_CODE,
    message: '请先登录',
  };

  assert.deepEqual(
    await normalizeAuthRequiredResult({
      status: 401,
      payload,
    }),
    {
      status: 401,
      payload,
    },
  );
});

test('normalizes auth-required results from response-like inputs', async () => {
  const payload: AuthRequiredResponsePayload = {
    success: false,
    code: AUTH_REQUIRED_CODE,
    message: '请先登录',
  };

  const response = new Response(JSON.stringify(payload), {
    status: 401,
    headers: {
      'content-type': 'application/json',
    },
  });

  assert.deepEqual(await normalizeAuthRequiredResult(response), {
    status: 401,
    payload,
  });
});

test('ignores near misses when normalizing auth-required results', async () => {
  const payload: AuthRequiredResponsePayload = {
    success: false,
    code: AUTH_REQUIRED_CODE,
    message: '请先登录',
  };

  assert.equal(
    await normalizeAuthRequiredResult({
      status: 200,
      payload,
    }),
    null,
  );

  assert.equal(
    await normalizeAuthRequiredResult({
      status: 401,
      payload: {
        ...payload,
        code: 'OTHER',
      },
    }),
    null,
  );

  assert.equal(
    await normalizeAuthRequiredResult({
      status: 401,
      payload: {
        code: AUTH_REQUIRED_CODE,
      },
    }),
    null,
  );
});
