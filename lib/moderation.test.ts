import assert from 'node:assert/strict';
import test from 'node:test';

const {
  MODERATION_STATUSES,
  parseModerationRequest,
  actionToModerationStatus,
  getPublicModerationStatuses,
  maskModeratedMedia,
  isAdminRole,
} = await import(new URL('./moderation.ts', import.meta.url).href);

test('defines supported moderation statuses', () => {
  assert.deepEqual(MODERATION_STATUSES, ['active', 'hidden', 'nsfw']);
});

test('parses valid moderation requests and rejects invalid values', () => {
  assert.deepEqual(
    parseModerationRequest({ content_type: 'image', content_id: 'abc', action: 'hide' }),
    { contentType: 'image', contentId: 'abc', action: 'hide' },
  );

  assert.throws(
    () => parseModerationRequest({ content_type: 'audio', content_id: 'abc', action: 'hide' }),
    /content_type/,
  );
  assert.throws(
    () => parseModerationRequest({ content_type: 'image', content_id: '', action: 'hide' }),
    /content_id/,
  );
  assert.throws(
    () => parseModerationRequest({ content_type: 'image', content_id: 'abc', action: 'delete' }),
    /action/,
  );
});

test('maps actions to moderation statuses', () => {
  assert.equal(actionToModerationStatus('restore'), 'active');
  assert.equal(actionToModerationStatus('hide'), 'hidden');
  assert.equal(actionToModerationStatus('nsfw'), 'nsfw');
});

test('returns public moderation statuses from filters', () => {
  assert.deepEqual(getPublicModerationStatuses(null), ['active', 'nsfw']);
  assert.deepEqual(getPublicModerationStatuses('all'), ['active', 'hidden', 'nsfw']);
  assert.deepEqual(getPublicModerationStatuses('hidden'), ['hidden']);
});

test('masks NSFW media without changing active or hidden media', () => {
  assert.deepEqual(
    maskModeratedMedia({ url: 'https://cdn/image.png', moderation_status: 'nsfw' }, 'url'),
    { url: null, moderation_status: 'nsfw' },
  );
  assert.deepEqual(
    maskModeratedMedia({ url: 'https://cdn/image.png', moderation_status: 'hidden' }, 'url'),
    { url: 'https://cdn/image.png', moderation_status: 'hidden' },
  );
});

test('recognizes admin role exactly', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('user'), false);
  assert.equal(isAdminRole(null), false);
});
