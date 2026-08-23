import test from 'node:test';
import assert from 'node:assert/strict';
import { astro } from 'iztro';
import {
  buildPalaceFlights,
  groupSelfMutationsByBranch,
} from '../src/utils/ziweiMutations.js';

test('宫干四化从 iztro 绑定宫位生成 48 条真实飞化', () => {
  const chart = astro.bySolar('1998-1-2', 4, '男', true, 'zh-CN');
  const flights = buildPalaceFlights(chart);

  assert.equal(flights.length, 48);
  assert.deepEqual(
    flights.filter((flight) => flight.sourceName === '命宫').map(({ mutagen, targetName }) => `${mutagen}→${targetName}`),
    ['禄→命宫', '权→财帛', '科→兄弟', '忌→兄弟'],
  );
});

test('小箭头只标识离心自化与向心自化', () => {
  const chart = astro.bySolar('1998-1-2', 4, '男', true, 'zh-CN');
  const grouped = groupSelfMutationsByBranch(buildPalaceFlights(chart));
  const mutations = Object.values(grouped).flat();

  assert.equal(mutations.length, 8);
  assert.deepEqual(
    mutations.filter((item) => item.kind === 'outward').map((item) => `${item.sourceName}${item.mutagen}`).sort(),
    ['子女科', '命宫禄', '官禄禄', '父母禄'].sort(),
  );
  assert.deepEqual(
    mutations.filter((item) => item.kind === 'inward').map((item) => `${item.sourceName}${item.mutagen}→${item.targetName}`).sort(),
    ['仆役禄→兄弟', '疾厄忌→父母', '子女权→田宅', '父母科→疾厄'].sort(),
  );
});
