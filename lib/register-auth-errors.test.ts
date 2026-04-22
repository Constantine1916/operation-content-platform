import assert from 'node:assert/strict';
import test from 'node:test';

const {
  getFriendlyRegisterErrorMessage,
  getRegisterUserLookupFailure,
  isExistingEmailSignUpResult,
} = await import(new URL('./register-auth-errors.ts', import.meta.url).href);

test('maps Supabase email rate limit errors to a friendly register message', () => {
  assert.equal(
    getFriendlyRegisterErrorMessage({
      code: 'over_email_send_rate_limit',
      message: 'email rate limit exceeded',
    }),
    '当前注册请求较多，请稍后再试。若你刚刚已经提交过注册，也可以先去邮箱查收验证邮件。',
  );
});

test('maps duplicate email signup responses to a login hint', () => {
  assert.equal(
    getFriendlyRegisterErrorMessage({
      message: 'User already registered',
    }),
    '该邮箱已注册，请直接登录，或使用找回密码继续。',
  );
});

test('detects Supabase duplicate signup pseudo-user payloads', () => {
  assert.equal(
    isExistingEmailSignUpResult(
      { identities: [], role: '' },
      null,
    ),
    true,
  );

  assert.equal(
    isExistingEmailSignUpResult(
      { identities: [{ id: 'identity-1' }], role: 'authenticated' },
      null,
    ),
    false,
  );
});

test('distinguishes service-role misconfiguration from missing auth users', () => {
  assert.deepEqual(
    getRegisterUserLookupFailure(
      { status: 401, message: 'Invalid API key' },
      null,
    ),
    {
      status: 500,
      message: '注册服务配置异常，请稍后再试',
    },
  );

  assert.deepEqual(
    getRegisterUserLookupFailure(
      { status: 404, code: 'user_not_found', message: 'User not found' },
      null,
    ),
    {
      status: 400,
      message: '用户不存在',
    },
  );
});
