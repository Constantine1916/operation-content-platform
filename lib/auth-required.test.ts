import assert from 'node:assert/strict';
import test from 'node:test';

const { AUTH_REQUIRED_CODE, isAuthRequiredResponse } = await import('./auth-required.ts');

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
