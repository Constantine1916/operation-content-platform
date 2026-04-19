import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('favorite toggles use the shared auth action gate before mutating state', async () => {
  const source = await readFile(new URL('./useFavoriteToggle.ts', import.meta.url), 'utf8');

  assert.match(source, /useAuthActionGate/);
  assert.match(source, /useAuthRequiredHandler/);
  assert.match(source, /const actionKind = shouldFavorite \? 'favorite' : 'unfavorite'/);
  assert.match(source, /const session = await requireAuthForAction/);
  assert.match(source, /const authRequired = await handleAuthRequired/);
  assert.match(source, /kind: actionKind/);
  assert.doesNotMatch(source, /请先登录后再收藏/);
});
