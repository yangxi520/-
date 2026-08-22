import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HOME_FORTUNE_PERIODS,
  buildHomeFortune,
  createHoroscopeFromRecord,
} from '../src/utils/homeFortune.js';

const SOLAR_RECORD = Object.freeze({
  id: 'solar-profile',
  type: 'ziwei',
  name: '测试档案',
  calendarType: 'solar',
  birthDate: '1990-01-01',
  solarDate: '1990-01-01',
  timeHour: 0,
  gender: 'male',
});

const CURRENT_TIME = new Date(2024, 1, 10, 12, 30);
const STEM_BRANCH_PATTERN = /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/;

test('首页运势入口顺序稳定且包含展示元数据', () => {
  assert.deepEqual(
    HOME_FORTUNE_PERIODS.map(({ key, label }) => ({ key, label })),
    [
      { key: 'hourly', label: '今时运势' },
      { key: 'daily', label: '今日运势' },
      { key: 'monthly', label: '今月运势' },
      { key: 'yearly', label: '今年运势' },
    ],
  );
  assert.ok(HOME_FORTUNE_PERIODS.every(({ icon }) => typeof icon === 'string' && icon));
});

test('阳历档案可生成今时、今日、今月和今年摘要', () => {
  for (const { key, label, icon } of HOME_FORTUNE_PERIODS) {
    const result = buildHomeFortune(SOLAR_RECORD, key, CURRENT_TIME);

    assert.equal(result.period, key);
    assert.equal(result.periodLabel, label);
    assert.equal(result.periodIcon, icon);
    assert.equal(result.profileName, SOLAR_RECORD.name);
    assert.equal(result.record, SOLAR_RECORD);
    assert.match(result.dateLabel, /2024/);
    assert.match(result.stemBranch, STEM_BRANCH_PATTERN);
    assert.ok(result.palaceName);
    assert.match(result.palaceBranch, /^[子丑寅卯辰巳午未申酉戌亥]$/);
    assert.ok(result.decadalPalaceName);
    assert.ok(Number.isInteger(result.nominalAge) && result.nominalAge > 0);
    assert.deepEqual(result.mutagens.map(({ label: mutagenLabel }) => mutagenLabel), ['禄', '权', '科', '忌']);
    assert.ok(result.mutagens.every(({ star }) => typeof star === 'string' && star));
    assert.ok(Array.isArray(result.movingStars));
    assert.ok(result.movingStars.every((name) => typeof name === 'string' && name));
    assert.ok(result.summary.length > 8);
    assert.ok(result.action.length > 8);
    assert.ok(result.caution.length > 8);
    assert.equal(typeof result.dayBoundaryNote, 'string');
  }
});

test('农历档案能重建十二宫并生成中性运势摘要', () => {
  const lunarRecord = {
    ...SOLAR_RECORD,
    id: 'lunar-profile',
    name: '',
    calendarType: 'lunar',
    birthDate: '1989-12-5',
  };

  const horoscope = createHoroscopeFromRecord(lunarRecord);
  assert.equal(horoscope.palaces.length, 12);
  assert.equal(horoscope.rawDates.lunarDate.lunarYear, 1989);

  const result = buildHomeFortune(lunarRecord, 'daily', CURRENT_TIME);
  assert.equal(result.profileName, '未命名档案');
  assert.equal(result.period, 'daily');
  assert.match(result.stemBranch, STEM_BRANCH_PATTERN);
  assert.ok(result.summary && result.action && result.caution);
});

test('晚子时保留换日提示', () => {
  const result = buildHomeFortune(
    SOLAR_RECORD,
    'hourly',
    new Date(2024, 1, 10, 23, 30),
  );

  assert.match(result.dateLabel, /晚子时/);
  assert.match(result.dayBoundaryNote, /次日换日/);
});

test('坏日期和无效类型抛出明确错误', () => {
  assert.throws(
    () => createHoroscopeFromRecord({ ...SOLAR_RECORD, birthDate: '2024-02-31' }),
    /公历出生日期无效/,
  );
  assert.throws(
    () => createHoroscopeFromRecord({ ...SOLAR_RECORD, type: 'money' }),
    /不支持的档案类型/,
  );
  assert.throws(
    () => buildHomeFortune(SOLAR_RECORD, 'weekly', CURRENT_TIME),
    /不支持的首页运势类型/,
  );
});
