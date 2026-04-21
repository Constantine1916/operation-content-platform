import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('hotspots server queries use created_at for Beijing date filtering and ordering', async () => {
  const apiSource = await read('./api/hotspots/route.ts');
  const serverSource = await read('../lib/server/public-content.ts');

  assert.match(apiSource, /getBeijingDateRange/);
  assert.match(apiSource, /gte\('created_at', startIso\)/);
  assert.match(apiSource, /lt\('created_at', endIso\)/);
  assert.match(apiSource, /order\('created_at', \{ ascending: false \}\)/);
  assert.doesNotMatch(apiSource, /order\('collected_date'/);
  assert.doesNotMatch(apiSource, /order\('collected_time'/);

  assert.match(serverSource, /gte\('created_at', startIso\)/);
  assert.match(serverSource, /lt\('created_at', endIso\)/);
  assert.match(serverSource, /order\('created_at', \{ ascending: false \}\)/);
});

test('public and profile hotspot/article views format created_at through the shared Beijing helper', async () => {
  const hotspotsPage = await read('../components/public/PublicHotspotsPage.tsx');
  const articlesPage = await read('../components/public/PublicArticlesPage.tsx');
  const profileCards = await read('../components/profile/ProfileContentCards.tsx');
  const favoritesRoute = await read('./api/favorites/route.ts');

  assert.match(hotspotsPage, /formatBeijingDateTime\(hotspot\.created_at/);
  assert.doesNotMatch(hotspotsPage, /hotspot\.collected_date/);
  assert.doesNotMatch(hotspotsPage, /hotspot\.collected_time/);

  assert.match(articlesPage, /formatBeijingDateTime\(article\.created_at/);
  assert.match(articlesPage, /formatBeijingDateTime\(selectedArticle\.created_at/);

  assert.match(profileCards, /formatBeijingDateTime\(hotspot\.created_at/);
  assert.match(profileCards, /formatBeijingDateTime\(article\.created_at/);
  assert.match(favoritesRoute, /created_at/);
});
