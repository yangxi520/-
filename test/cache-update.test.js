import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('生产构建不再注册 Workbox PWA 缓存', async () => {
  const [viteConfig, mainEntry] = await Promise.all([
    readProjectFile('vite.config.js'),
    readProjectFile('src/main.jsx'),
  ]);

  assert.doesNotMatch(viteConfig, /VitePWA/);
  assert.doesNotMatch(mainEntry, /serviceWorker\.register/);
  assert.match(mainEntry, /registration\.unregister/);
});

test('旧 Service Worker 会清理自身与 Cache Storage', async () => {
  const [cleanupWorker, vercelJson] = await Promise.all([
    readProjectFile('public/sw.js'),
    readProjectFile('vercel.json'),
  ]);
  const vercelConfig = JSON.parse(vercelJson);
  const rootHeaders = vercelConfig.headers.find((rule) => rule.source === '/');
  const cacheControl = rootHeaders.headers.find((header) => header.key === 'Cache-Control');

  assert.match(cleanupWorker, /caches\.delete/);
  assert.match(cleanupWorker, /registration\.unregister/);
  assert.doesNotMatch(cleanupWorker, /addEventListener\(['"]fetch/);
  assert.match(cacheControl.value, /no-store/);
});
