import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const {
  completePostAuthSuccess,
  executeAuthRouteLaunch,
  getAuthRouteLaunchState,
  getPostAuthSuccessState,
  getSafeAuthRedirectTo,
} = await import(new URL('../components/auth/auth-route-launcher-utils.ts', import.meta.url).href);

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('root layout installs the shared auth modal provider', async () => {
  const source = await read('./layout.tsx');

  assert.match(source, /AuthModalProvider/);
  assert.match(source, /<AuthModalProvider>[\s\S]*\{children\}[\s\S]*<\/AuthModalProvider>/);
});

test('/login delegates to AuthRouteLauncher with the login tab', async () => {
  const source = await read('./login/page.tsx');

  assert.doesNotMatch(source, /^'use client';?/m);
  assert.match(source, /Suspense/);
  assert.match(source, /AuthRouteLauncher/);
  assert.match(source, /defaultTab="login"/);
});

test('/register delegates to AuthRouteLauncher with the register tab', async () => {
  const source = await read('./register/page.tsx');

  assert.doesNotMatch(source, /^'use client';?/m);
  assert.match(source, /Suspense/);
  assert.match(source, /AuthRouteLauncher/);
  assert.match(source, /defaultTab="register"/);
});

test('launcher runtime opens the modal for guests and redirects signed-in users safely', async () => {
  const modalCalls: Array<{ defaultTab: 'login' | 'register'; redirectTo: string | null }> = [];
  const redirectCalls: string[] = [];

  await executeAuthRouteLaunch({
    defaultTab: 'login',
    redirectTo: '/profile/alice',
    getSession: async () => ({ data: { session: null } }),
    openAuthModal: (options: { defaultTab: 'login' | 'register'; redirectTo: string | null }) => modalCalls.push(options),
    replace: (target: string) => redirectCalls.push(target),
  });

  assert.deepEqual(modalCalls, [{ defaultTab: 'login', redirectTo: '/profile/alice' }]);
  assert.deepEqual(redirectCalls, ['/']);

  modalCalls.length = 0;
  redirectCalls.length = 0;

  await executeAuthRouteLaunch({
    defaultTab: 'register',
    redirectTo: '/login%2F',
    getSession: async () => ({ data: { session: { user: { id: 'u_1' } } } }),
    openAuthModal: (options: { defaultTab: 'login' | 'register'; redirectTo: string | null }) => modalCalls.push(options),
    replace: (target: string) => redirectCalls.push(target),
  });

  assert.deepEqual(modalCalls, []);
  assert.deepEqual(redirectCalls, ['/']);
});

test('launcher runtime honors cancellation before mutating global auth ui', async () => {
  const modalCalls: Array<{ defaultTab: 'login' | 'register'; redirectTo: string | null }> = [];
  const redirectCalls: string[] = [];

  await executeAuthRouteLaunch({
    defaultTab: 'login',
    redirectTo: '/profile/alice',
    getSession: async () => ({ data: { session: null } }),
    openAuthModal: (options: { defaultTab: 'login' | 'register'; redirectTo: string | null }) => modalCalls.push(options),
    replace: (target: string) => redirectCalls.push(target),
    shouldContinue: () => false,
  });

  assert.deepEqual(modalCalls, []);
  assert.deepEqual(redirectCalls, []);
});

test('launcher runtime falls back to guest-safe behavior when session lookup fails', async () => {
  const modalCalls: Array<{ defaultTab: 'login' | 'register'; redirectTo: string | null }> = [];
  const redirectCalls: string[] = [];

  await executeAuthRouteLaunch({
    defaultTab: 'register',
    redirectTo: '/profile/alice',
    getSession: async () => {
      throw new Error('session unavailable');
    },
    openAuthModal: (options: { defaultTab: 'login' | 'register'; redirectTo: string | null }) => modalCalls.push(options),
    replace: (target: string) => redirectCalls.push(target),
  });

  assert.deepEqual(modalCalls, [{ defaultTab: 'register', redirectTo: '/profile/alice' }]);
  assert.deepEqual(redirectCalls, ['/']);
});

test('post-auth runtime closes, resumes, redirects, and refreshes in the expected order', async () => {
  const events: string[] = [];

  await completePostAuthSuccess({
    redirectTo: '/profile/alice',
    resumeAction: async () => {
      events.push('resume');
    },
    onClose: () => {
      events.push('close');
    },
    push: (target: string) => {
      events.push(`push:${target}`);
    },
    refresh: () => {
      events.push('refresh');
    },
  });

  assert.deepEqual(events, ['close', 'resume', 'push:/profile/alice', 'refresh']);

  events.length = 0;

  await completePostAuthSuccess({
    redirectTo: '/register%2f',
    resumeAction: null,
    onClose: () => {
      events.push('close');
    },
    push: (target: string) => {
      events.push(`push:${target}`);
    },
    refresh: () => {
      events.push('refresh');
    },
  });

  assert.deepEqual(events, ['close', 'push:/overview', 'refresh']);
});

test('launcher normalizes guest redirects and strips auth-route loops', () => {
  assert.equal(getSafeAuthRedirectTo('/overview?tab=latest'), '/overview?tab=latest');
  assert.equal(getSafeAuthRedirectTo('/../login'), null);
  assert.equal(getSafeAuthRedirectTo('/foo/../register'), null);
  assert.equal(getSafeAuthRedirectTo('/login/'), null);
  assert.equal(getSafeAuthRedirectTo('/register/'), null);
  assert.equal(getSafeAuthRedirectTo('/login%2F'), null);
  assert.equal(getSafeAuthRedirectTo('/register%2f'), null);
  assert.equal(getSafeAuthRedirectTo('/foo%2F..%2Fregister'), null);
  assert.equal(getSafeAuthRedirectTo('/foo%2F..%2Flogin'), null);
  assert.equal(getSafeAuthRedirectTo('/login%252F'), null);
  assert.equal(getSafeAuthRedirectTo('/register%252f'), null);
  assert.equal(getSafeAuthRedirectTo('/%2e%2e/login'), null);
  assert.equal(getSafeAuthRedirectTo('https://example.com/login'), null);

  assert.deepEqual(
    getAuthRouteLaunchState({
      hasSession: false,
      redirectTo: '/profile/alice',
    }),
    {
      shouldOpenModal: true,
      modalRedirectTo: '/profile/alice',
      navigationTarget: '/',
    },
  );
});

test('launcher skips the modal for signed-in users and redirects safely', () => {
  assert.deepEqual(
    getAuthRouteLaunchState({
      hasSession: true,
      redirectTo: '/overview',
    }),
    {
      shouldOpenModal: false,
      modalRedirectTo: null,
      navigationTarget: '/overview',
    },
  );

  assert.deepEqual(
    getAuthRouteLaunchState({
      hasSession: true,
      redirectTo: '/register/',
    }),
    {
      shouldOpenModal: false,
      modalRedirectTo: null,
      navigationTarget: '/',
    },
  );
});

test('post-auth success state preserves safe redirects and resume-action behavior', () => {
  assert.deepEqual(
    getPostAuthSuccessState({
      redirectTo: '/profile/alice',
      hasResumeAction: false,
    }),
    {
      shouldResumeAction: false,
      navigationTarget: '/profile/alice',
    },
  );

  assert.deepEqual(
    getPostAuthSuccessState({
      redirectTo: '/login/',
      hasResumeAction: false,
    }),
    {
      shouldResumeAction: false,
      navigationTarget: '/overview',
    },
  );

  assert.deepEqual(
    getPostAuthSuccessState({
      redirectTo: '/register%252f',
      hasResumeAction: false,
    }),
    {
      shouldResumeAction: false,
      navigationTarget: '/overview',
    },
  );

  assert.deepEqual(
    getPostAuthSuccessState({
      redirectTo: null,
      hasResumeAction: true,
    }),
    {
      shouldResumeAction: true,
      navigationTarget: null,
    },
  );
});
