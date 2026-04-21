import assert from 'node:assert/strict';
import test from 'node:test';

const { formatBeijingDateTime } = await import(
  new URL('./beijing-time.ts', import.meta.url).href
);

test('formats UTC created_at values as Beijing local time to the minute', () => {
  assert.equal(
    formatBeijingDateTime('2026-04-20T22:02:06.225705+00:00'),
    '2026/04/21 06:02'
  );
  assert.equal(
    formatBeijingDateTime('2026-04-21T02:44:07.909128+00:00'),
    '2026/04/21 10:44'
  );
});

test('falls back safely when created_at is missing or invalid', () => {
  assert.equal(formatBeijingDateTime(undefined), '未知');
  assert.equal(formatBeijingDateTime('not-a-date'), '未知');
});
