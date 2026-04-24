import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const submitRouteUrl = new URL('./generate-image/submit/route.ts', import.meta.url);
const pollRouteUrl = new URL('./generate-image/poll/route.ts', import.meta.url);
const historyRouteUrl = new URL('./generate-image/history/route.ts', import.meta.url);
const generatePageUrl = new URL('../generate-img/page.tsx', import.meta.url);
const envExampleUrl = new URL('../../.env.example', import.meta.url);
const readmeUrl = new URL('../../README.md', import.meta.url);

test('generate image backend no longer depends on Haiyi-specific integration', async () => {
  const sources = await Promise.all([
    readFile(submitRouteUrl, 'utf8'),
    readFile(pollRouteUrl, 'utf8'),
    readFile(new URL('../../lib/server/image-generation.ts', import.meta.url), 'utf8').catch(() => ''),
  ]);
  const joined = sources.join('\n');

  assert.doesNotMatch(joined, /HAIYI/);
  assert.doesNotMatch(joined, /haiyi\.art/);
  assert.doesNotMatch(joined, /haiyi-proxy/);
  assert.match(joined, /IMAGE_GENERATION_BASE_URL/);
  assert.match(joined, /IMAGE_GENERATION_API_KEY/);
});

test('submit only enqueues image generation tasks without calling the provider', async () => {
  const source = await readFile(submitRouteUrl, 'utf8');

  assert.doesNotMatch(source, /images\/generations/);
  assert.doesNotMatch(source, /generateImage\(/);
  assert.match(source, /status:\s*1/);
  assert.match(source, /process:\s*0/);
});

test('poll advances at most one queued image task through the provider', async () => {
  const source = await readFile(pollRouteUrl, 'utf8');

  assert.match(source, /waitUntil\(/);
  assert.match(source, /maxDuration\s*=\s*300/);
  assert.match(source, /generateImage\(/);
  assert.match(source, /status:\s*2/);
  assert.match(source, /status:\s*3/);
  assert.match(source, /limit\(1\)/);
});

test('poll can retry stale in-progress image tasks', async () => {
  const source = await readFile(pollRouteUrl, 'utf8');

  assert.match(source, /STALE_GENERATING_MS/);
  assert.match(source, /\.eq\('status',\s*2\)/);
  assert.match(source, /\.lt\('updated_at'/);
  assert.match(source, /status:\s*1/);
});

test('poll quickly recovers legacy interrupted image tasks', async () => {
  const source = await readFile(pollRouteUrl, 'utf8');

  assert.match(source, /STALE_LEGACY_GENERATING_MS/);
  assert.match(source, /\.lte\('process',\s*1\)/);
  assert.match(source, /process:\s*5/);
});

test('image generation provider has a timeout shorter than the Vercel function duration', async () => {
  const source = await readFile(new URL('../../lib/server/image-generation.ts', import.meta.url), 'utf8');

  assert.match(source, /IMAGE_GENERATION_TIMEOUT_MS/);
  assert.match(source, /AbortSignal\.timeout/);
  assert.match(source, /signal:/);
});

test('image generation default timeout covers observed slow provider responses with Vercel margin', async () => {
  const source = await readFile(new URL('../../lib/server/image-generation.ts', import.meta.url), 'utf8');
  const match = source.match(/DEFAULT_IMAGE_GENERATION_TIMEOUT_MS\s*=\s*([\d_]+)/);
  assert.ok(match, 'DEFAULT_IMAGE_GENERATION_TIMEOUT_MS must be defined');

  const timeoutMs = Number(match[1].replace(/_/g, ''));
  assert.ok(timeoutMs >= 270_000, 'default timeout must cover 245s provider responses plus margin');
  assert.ok(timeoutMs <= 285_000, 'default timeout must leave time for DB writes before Vercel maxDuration');
});

test('generate image UI describes the new one-image-per-run provider', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.doesNotMatch(source, /每次生成 4 张图/);
  assert.match(source, /每次生成 1 张图/);
});

test('generate image UI preserves provider errors returned by polling', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.match(source, /error:\s*item\.error/);
});

test('generate image UI uses capped fake progress while tasks are generating', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.match(source, /FAKE_PROGRESS_CAP\s*=\s*95/);
  assert.match(source, /FAKE_PROGRESS_INTERVAL_MS\s*=\s*1000/);
  assert.match(source, /advanceFakeProgress/);
  assert.match(source, /mergePolledProgress/);
  assert.match(source, /latestGroupsRef/);
  assert.match(source, /Math\.min\(FAKE_PROGRESS_CAP/);
});

test('generate image UI opens generated images in the shared image preview lightbox', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.match(source, /ImagePreviewLightbox/);
  assert.match(source, /selectedPreviewIndex/);
  assert.match(source, /setSelectedPreviewIndex/);
  assert.match(source, /getGeneratedPreviewItems/);
  assert.match(source, /onClick=\{\(\) => \{/);
  assert.match(source, /setSelectedPreviewIndex\(previewIndex\)/);
  assert.match(source, /selectedIndex=\{selectedPreviewIndex\}/);
});

test('generate image APIs allow authenticated users instead of SVIP-only access', async () => {
  const sources = await Promise.all([
    readFile(submitRouteUrl, 'utf8'),
    readFile(pollRouteUrl, 'utf8'),
    readFile(historyRouteUrl, 'utf8'),
  ]);
  const joined = sources.join('\n');

  assert.doesNotMatch(joined, /requireSVIP/);
  assert.doesNotMatch(joined, /需要 SVIP 权限/);
  assert.match(joined, /requireImageGenerationUser/);
});

test('normal image generation users are limited to 20 submitted tasks per rolling hour', async () => {
  const source = await readFile(new URL('../../lib/server/image-generation-access.ts', import.meta.url), 'utf8');

  assert.match(source, /NORMAL_USER_HOURLY_TASK_LIMIT\s*=\s*20/);
  assert.match(source, /NORMAL_USER_RATE_WINDOW_MS\s*=\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(source, /vipLevel\s*>=\s*1/);
  assert.match(source, /\.select\('id',\s*\{\s*count:\s*'exact',\s*head:\s*true\s*\}\)/);
  assert.match(source, /\.gte\('created_at',\s*cutoff\)/);
  assert.match(source, /status:\s*429/);
});

test('generate image UI is visible to signed-in non-SVIP users with the normal quota copy', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.doesNotMatch(source, /cached\s*<\s*2/);
  assert.doesNotMatch(source, /fresh\s*!==\s*null\s*&&\s*fresh\s*<\s*2/);
  assert.doesNotMatch(source, /Image Generation · SVIP/);
  assert.match(source, /普通用户每小时 20 个任务/);
  assert.match(source, /VIP\/SVIP 不限量/);
});

test('generate image CSV import is only available to SVIP users', async () => {
  const source = await readFile(generatePageUrl, 'utf8');

  assert.match(source, /const isSvipUser = vipLevel !== null && vipLevel >= 2/);
  assert.match(source, /if \(!isSvipUser\) return/);
  assert.match(source, /\{isSvipUser && \(\s*<>[\s\S]*导入 CSV[\s\S]*<\/>\s*\)\}/);
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
