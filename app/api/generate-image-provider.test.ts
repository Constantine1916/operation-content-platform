import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const submitRouteUrl = new URL('./generate-image/submit/route.ts', import.meta.url);
const pollRouteUrl = new URL('./generate-image/poll/route.ts', import.meta.url);
const generatePageUrl = new URL('../generate-img/page.tsx', import.meta.url);
const envExampleUrl = new URL('../../.env.example', import.meta.url);
const readmeUrl = new URL('../../README.md', import.meta.url);

test('generate image backend no longer depends on Haiyi-specific integration', async () => {
  const sources = await Promise.all([
    readFile(submitRouteUrl, 'utf8'),
    readFile(pollRouteUrl, 'utf8'),
  ]);
  const joined = sources.join('\n');

  assert.doesNotMatch(joined, /HAIYI/);
  assert.doesNotMatch(joined, /haiyi\.art/);
  assert.doesNotMatch(joined, /haiyi-proxy/);
  assert.match(joined, /IMAGE_GENERATION_BASE_URL/);
  assert.match(joined, /IMAGE_GENERATION_API_KEY/);
});

test('generate image UI describes the new one-image-per-run provider', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.doesNotMatch(source, /每次生成 4 张图/);
  assert.match(source, /每次生成 1 张图/);
});

test('environment documentation exposes the new image generation provider variables', async () => {
  const [envExample, readme] = await Promise.all([
    readFile(envExampleUrl, 'utf8'),
    readFile(readmeUrl, 'utf8'),
  ]);

  assert.match(envExample, /IMAGE_GENERATION_BASE_URL/);
  assert.match(envExample, /IMAGE_GENERATION_API_KEY/);
  assert.match(readme, /IMAGE_GENERATION_BASE_URL/);
  assert.match(readme, /IMAGE_GENERATION_API_KEY/);
  assert.doesNotMatch(envExample, /HAIYI/);
  assert.doesNotMatch(readme, /HAIYI/);
});
