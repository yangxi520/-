import test from 'node:test';
import assert from 'node:assert/strict';
import { astro } from 'iztro';
import {
  analyzeZiweiPatterns,
  analyzeZiweiStructures,
  formatZiweiPatternReport,
  ZIWEI_PATTERN_RULE_COUNT,
} from '../src/utils/ziweiPatterns.js';

test('本命三奇加会只在生年禄权科齐会命宫三方四正时成立', () => {
  const positive = astro.bySolar('1995-1-1', 0, '女', true, 'zh-CN');
  const negative = astro.bySolar('1998-1-2', 4, '女', true, 'zh-CN');

  const hit = analyzeZiweiPatterns(positive).find((pattern) => pattern.id === 'origin-three-wonders');
  assert.equal(hit?.name, '三奇加会');
  assert.equal(hit?.status, 'established');
  assert.equal(hit?.fortuneLabel, '成');
  assert.equal(hit?.evidence.length, 3);
  assert.match(hit?.evidence.join('\n') || '', /生年化禄/);
  assert.match(hit?.evidence.join('\n') || '', /生年化权/);
  assert.match(hit?.evidence.join('\n') || '', /生年化科/);
  assert.match(hit?.source.rule || '', /不可跨层拼接/);
  assert.equal(
    analyzeZiweiPatterns(negative).some((pattern) => pattern.id === 'origin-three-wonders'),
    false,
  );
});

test('机月同梁同时核对命宫寅申与四星齐会', () => {
  const positive = astro.bySolar('1990-1-4', 11, '女', true, 'zh-CN');
  const negative = astro.bySolar('1998-1-2', 4, '女', true, 'zh-CN');

  const hit = analyzeZiweiPatterns(positive).find((pattern) => pattern.name === '机月同梁格');
  assert.equal(hit?.status, 'established');
  assert.match(hit?.evidence.join('\n') || '', /命宫在[寅申]/);
  assert.match(hit?.evidence.join('\n') || '', /天机/);
  assert.match(hit?.evidence.join('\n') || '', /太阴/);
  assert.match(hit?.evidence.join('\n') || '', /天同/);
  assert.match(hit?.evidence.join('\n') || '', /天梁/);
  assert.equal(analyzeZiweiPatterns(negative).some((pattern) => pattern.name === '机月同梁格'), false);
});

test('七杀朝斗按命宫主星和子午寅申地支共同判定', () => {
  const positive = astro.bySolar('1988-1-6', 4, '女', true, 'zh-CN');
  const hit = analyzeZiweiPatterns(positive).find((pattern) => pattern.name === '七杀朝斗格');

  assert.equal(hit?.status, 'established');
  assert.match(hit?.evidence.join('\n') || '', /七杀/);
  assert.match(hit?.evidence.join('\n') || '', /命宫地支为申/);
});

test('参考命盘不再用自创结构冒充古典格局', () => {
  const chart = astro.bySolar('1998-1-2', 4, '女', true, 'zh-CN');
  const patterns = analyzeZiweiPatterns(chart);
  const structures = analyzeZiweiStructures(chart);

  assert.deepEqual(patterns, []);
  assert.deepEqual(structures.map((item) => item.name), ['杀破狼星系']);
  assert.equal(structures[0].category, 'star-system');
  assert.equal(structures[0].status, 'observed');
  assert.match(structures[0].summary, /不等同于古典吉格/);
  assert.match(structures[0].evidence.join('\n'), /七杀.*命宫/);
  assert.match(structures[0].evidence.join('\n'), /破军.*官禄/);
  assert.match(structures[0].evidence.join('\n'), /贪狼.*财帛/);
});

test('严格结果全部带规则来源且禁用未经核验的名称和吉凶标签', () => {
  const charts = [
    astro.bySolar('1995-1-1', 0, '女', true, 'zh-CN'),
    astro.bySolar('1990-1-4', 11, '女', true, 'zh-CN'),
    astro.bySolar('1988-1-6', 4, '女', true, 'zh-CN'),
    astro.bySolar('1998-1-2', 4, '女', true, 'zh-CN'),
  ];
  const results = charts.flatMap((chart) => [
    ...analyzeZiweiPatterns(chart),
    ...analyzeZiweiStructures(chart),
  ]);

  assert.equal(ZIWEI_PATTERN_RULE_COUNT >= 10, true);
  assert.equal(results.every((result) => result.evidence.length > 0), true);
  assert.equal(results.every((result) => /^https:\/\//.test(result.source.url)), true);
  assert.equal(results.every((result) => result.source.rule && result.source.section), true);
  assert.equal(results.some((result) => /武曲七杀同宫|命位无正曜|宽式/.test(result.name)), false);
  assert.equal(results.some((result) => ['吉', '平', '凶'].includes(result.fortuneLabel)), false);
});

test('报告区分经典格局与星系观察，空数据安全', () => {
  const chart = astro.bySolar('1998-1-2', 4, '女', true, 'zh-CN');
  const patterns = analyzeZiweiPatterns(chart);
  const structures = analyzeZiweiStructures(chart);
  const report = formatZiweiPatternReport(patterns, structures);

  assert.match(report, /经典格局：当前未识别/);
  assert.match(report, /星系观察/);
  assert.match(report, /杀破狼星系/);
  assert.match(report, /不等同古典吉格/);
  assert.deepEqual(analyzeZiweiPatterns(null), []);
  assert.deepEqual(analyzeZiweiStructures(null), []);
  assert.match(formatZiweiPatternReport([], []), /当前未识别/);
});
