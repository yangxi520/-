import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = (relativePath) => readFile(
  new URL(`../${relativePath}`, import.meta.url),
  'utf8',
);

test('紫微命盘默认打开紧凑专业盘并保留运限交互', async () => {
  const source = await readProjectFile('src/components/ProfessionalChart.jsx');

  assert.match(source, /useState\('professional'\)/);
  assert.match(source, /className="wenmo-board relative grid grid-cols-4 grid-rows-4"/);
  assert.match(source, /className="wenmo-layer-grid grid grid-cols-6/);
  assert.match(source, /className="chart-timeline wenmo-timeline/);
  assert.match(source, /handleSelection\('daxian', p\.index\)/);
  assert.match(source, /renderConnections\(\)/);
  assert.match(source, /mingPalace\?\.index/);
  assert.match(source, /viewBox="0 0 400 400"/);
  assert.match(source, /markerEnd=\{`url\(#\$\{target\.marker\}\)`\}/);
  assert.match(source, /className="wenmo-relation-toggle"/);
});

test('专业盘使用连续纸面网格并在打印时保持单页比例', async () => {
  const styles = await readProjectFile('src/index.css');

  assert.match(styles, /\.wenmo-board\s*\{[\s\S]*?aspect-ratio: 1 \/ 1\.08/);
  assert.match(styles, /\.wenmo-grid-cell,[\s\S]*?\.wenmo-center/);
  assert.match(styles, /\.wenmo-timeline-option\.is-active/);
  assert.match(styles, /@media print[\s\S]*?\.wenmo-board \{ aspect-ratio: 1 \/ 1 !important; \}/);
});
