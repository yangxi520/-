import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = (relativePath) => readFile(
  new URL(`../${relativePath}`, import.meta.url),
  'utf8',
);

test('紫微命盘默认打开高密度专业盘并保留运限交互', async () => {
  const source = await readProjectFile('src/components/ProfessionalChart.jsx');

  assert.match(source, /useState\('professional'\)/);
  assert.match(source, /data-testid="ziwei-chart-title"/);
  assert.match(source, /className="wenmo-board relative grid grid-cols-4 grid-rows-4"/);
  assert.equal((source.match(/data-direction=/g) || []).length, 4);
  assert.match(source, /className="wenmo-star-columns"/);
  assert.match(source, /className="wenmo-luck-table chart-timeline"/);
  assert.equal((source.match(/className="wenmo-luck-row/g) || []).length, 5);
  assert.match(source, /className="wenmo-mode-bar print:hidden"/);
  assert.match(source, /className="wenmo-bottom-tabs print:hidden"/);
  assert.match(source, /handleSelection\('daxian', palace\.index\)/);
  assert.match(source, /renderSanheConnections\(\)/);
  assert.match(source, /renderFlyConnections\(\)/);
  assert.match(source, /renderSelfMutationArrows\(\)/);
  assert.match(source, /data-testid="ziwei-self-mutation-layer"/);
  assert.match(source, /data-mutation-direction=\{entry\.kind\}/);
  assert.match(source, /data-testid="ziwei-fly-layer"/);
  assert.match(source, /mingPalace\?\.index/);
  assert.match(source, /viewBox="0 0 400 400"/);
  assert.match(source, /markerEnd=\{`url\(#self-mutation-arrow-\$\{entry\.key\}\)`\}/);
});

test('专业盘使用连续纸面网格、竖排星曜与五层运限', async () => {
  const styles = await readProjectFile('src/index.css');

  assert.match(styles, /\.wenmo-board\s*\{[\s\S]*?aspect-ratio: 1 \/ 1\.29/);
  assert.match(styles, /\.wenmo-grid-cell,[\s\S]*?\.wenmo-center/);
  assert.match(styles, /\.wenmo-star-column b\s*\{[\s\S]*?writing-mode: vertical-rl/);
  assert.match(styles, /\.wenmo-day-grid\s*\{[\s\S]*?grid-template-columns: repeat\(10/);
  assert.match(styles, /\.wenmo-luck-cell\.is-active/);
  assert.match(styles, /\.chart-action-bar \{ display: none !important; \}/);
  assert.match(styles, /\.wenmo-fly-path\s*\{[\s\S]*?animation: wenmo-fly-flow/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media print[\s\S]*?\.wenmo-board \{ aspect-ratio: 1 \/ 1 !important; \}/);
});
