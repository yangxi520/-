import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createZiweiHoroscope,
  getYinYangGenderLabel,
} from '../src/utils/ziweiBirth.js';

test('阴阳男女由年干阴阳与性别共同决定', () => {
  const yangChart = createZiweiHoroscope({
    calendarType: 'solar',
    birthDate: '1990-6-15',
    timeIndex: 6,
    gender: 'male',
  });
  const yinChart = createZiweiHoroscope({
    calendarType: 'solar',
    birthDate: '1998-1-2',
    timeIndex: 0,
    gender: 'female',
  });

  assert.equal(yangChart.rawDates.chineseDate.yearly[0], '庚');
  assert.equal(getYinYangGenderLabel(yangChart, 'male'), '阳男');
  assert.equal(getYinYangGenderLabel(yangChart, 'female'), '阳女');
  assert.equal(yinChart.rawDates.chineseDate.yearly[0], '丁');
  assert.equal(getYinYangGenderLabel(yinChart, 'male'), '阴男');
  assert.equal(getYinYangGenderLabel(yinChart, 'female'), '阴女');
});

test('农历普通月和闰月生成不同且可复核的命盘日期', () => {
  const regular = createZiweiHoroscope({
    calendarType: 'lunar',
    birthDate: '2023-2-1',
    timeIndex: 0,
    gender: 'female',
    isLeapMonth: false,
  });
  const leap = createZiweiHoroscope({
    calendarType: 'lunar',
    birthDate: '2023-2-1',
    timeIndex: 0,
    gender: 'female',
    isLeapMonth: true,
  });

  assert.equal(regular.solarDate, '2023-2-20');
  assert.equal(leap.solarDate, '2023-3-22');
  assert.equal(regular.palaces.length, 12);
  assert.equal(leap.palaces.length, 12);
});

test('紫微录入页接通闰月生成、保存与读取', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /const \[isLeapMonth, setIsLeapMonth\]/);
  assert.match(source, /isLeapMonth: effectiveIsLeapMonth/);
  assert.match(source, /record\.isLeapMonth \?\? record\.isLeap/);
  assert.match(source, /className="lunar-leap-toggle"/);
  assert.doesNotMatch(source, /当前不支持闰月标记/);
});
