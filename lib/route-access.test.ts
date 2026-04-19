import assert from 'node:assert/strict';
import test from 'node:test';

const {
  AUTH_ACTION_KINDS,
  isPublicAppPath,
  isPrivateAppPath,
  isPublicProfilePath,
  getAuthTabForAction,
  getAuthTabForPrivateRoute,
} = await import(new URL('./route-access.ts', import.meta.url).href);

test('classifies public app paths including overview and agent', () => {
  assert.equal(isPublicAppPath('/overview'), true);
  assert.equal(isPublicAppPath('/agent'), true);
  assert.equal(isPublicAppPath('/articles'), true);
  assert.equal(isPublicAppPath('/profile'), false);
});

test('classifies private app paths', () => {
  assert.equal(isPrivateAppPath('/profile'), true);
  assert.equal(isPrivateAppPath('/md2image'), true);
  assert.equal(isPrivateAppPath('/generate-img'), true);
  assert.equal(isPrivateAppPath('/overview'), false);
});

test('recognizes public profile paths', () => {
  assert.equal(isPublicProfilePath('/profile/alice'), true);
  assert.equal(isPublicProfilePath('/profile'), false);
});

test('maps auth modal defaults', () => {
  assert.equal(getAuthTabForPrivateRoute(), 'login');
  assert.equal(getAuthTabForAction('favorite'), 'register');
  assert.equal(getAuthTabForAction('unfavorite'), 'register');
  assert.equal(getAuthTabForAction('download'), 'register');
});

test('exports the full gated action contract', () => {
  assert.deepEqual(AUTH_ACTION_KINDS, ['favorite', 'unfavorite', 'download']);
});
