import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BAZI_HOUR_OPTIONS,
  buildBaziChart,
  getBaziDayCount,
  getBaziMonthOptions,
} from '../src/utils/baziChart.js';

const pillarText = (chart) => chart.pillars.map(({ ganZhi }) => ganZhi).join(' ');

test('时辰列表区分早子时与晚子时', () => {
  assert.equal(BAZI_HOUR_OPTIONS.length, 13);
  assert.deepEqual(
    {
      index: BAZI_HOUR_OPTIONS[0].index,
      hour: BAZI_HOUR_OPTIONS[0].hour,
      name: BAZI_HOUR_OPTIONS[0].name,
    },
    { index: 0, hour: 0, name: '早子时' },
  );
  assert.deepEqual(
    {
      index: BAZI_HOUR_OPTIONS[12].index,
      hour: BAZI_HOUR_OPTIONS[12].hour,
      name: BAZI_HOUR_OPTIONS[12].name,
    },
    { index: 12, hour: 23, name: '晚子时' },
  );
});

test('农历月份保留负数闰月并使用真实天数', () => {
  const months = getBaziMonthOptions('lunar', 2023);
  const regularSecondMonth = months.find(({ value }) => value === 2);
  const leapSecondMonth = months.find(({ value }) => value === -2);

  assert.equal(months.length, 13);
  assert.equal(regularSecondMonth.days, 30);
  assert.equal(leapSecondMonth.isLeap, true);
  assert.equal(leapSecondMonth.days, 29);
  assert.equal(getBaziDayCount('lunar', 2023, -2), 29);
  assert.equal(getBaziDayCount('solar', 2024, 2), 29);
});

test('2019年全球算命师大赛命例四柱正确', () => {
  const chart = buildBaziChart({
    calendarType: 'solar',
    year: 1962,
    month: 8,
    day: 26,
    hourIndex: 2,
    gender: 'female',
  });

  assert.equal(pillarText(chart), '壬寅 戊申 丙申 庚寅');
});

test('2021年全球算命师大赛命例四柱正确', () => {
  const chart = buildBaziChart({
    calendarType: 'solar',
    year: 1970,
    month: 7,
    day: 23,
    hourIndex: 4,
    gender: 'male',
  });

  assert.equal(pillarText(chart), '庚戌 癸未 甲辰 戊辰');
});

test('农历输入保留时辰并与对应公历命盘相同', () => {
  const lunarChart = buildBaziChart({
    calendarType: 'lunar',
    year: 2019,
    month: 12,
    day: 12,
    hourIndex: 6,
    gender: 'male',
  });
  const solarChart = buildBaziChart({
    calendarType: 'solar',
    year: 2020,
    month: 1,
    day: 6,
    hourIndex: 6,
    gender: 'male',
  });

  assert.equal(lunarChart.solarInfo.ymdHms, '2020-01-06 11:00:00');
  assert.equal(pillarText(lunarChart), '己亥 丁丑 戊申 戊午');
  assert.equal(pillarText(lunarChart), pillarText(solarChart));
});

test('晚子时按流派换日，早子时不二次换日', () => {
  const base = {
    calendarType: 'solar',
    year: 1988,
    month: 2,
    day: 15,
    hourIndex: 12,
    gender: 'male',
  };
  const lateZiMidnightSect = buildBaziChart({ ...base, daySect: 2 });
  const lateZiLateSect = buildBaziChart({ ...base, daySect: 1 });
  const earlyZi = buildBaziChart({
    ...base,
    day: 16,
    hourIndex: 0,
    daySect: 1,
  });

  assert.equal(lateZiMidnightSect.pillars[2].ganZhi, '庚子');
  assert.equal(lateZiLateSect.pillars[2].ganZhi, '辛丑');
  assert.equal(earlyZi.pillars[2].ganZhi, '辛丑');
  assert.equal(lateZiLateSect.pillars[3].zhi, '子');
  assert.equal(earlyZi.pillars[3].zhi, '子');
});

test('问真式柱数据完整，大运过滤空柱并标记当前流年', () => {
  const chart = buildBaziChart({
    calendarType: 'solar',
    year: 1970,
    month: 7,
    day: 23,
    hourIndex: 4,
    gender: 'male',
  }, new Date(2026, 7, 22, 12));

  assert.equal(
    Object.values(chart.surfaceWuxingCount).reduce((total, count) => total + count, 0),
    8,
  );
  assert.ok(chart.pillars.every((pillar) => (
    pillar.hiddenGans.length === pillar.hiddenShiShens.length
    && pillar.ganShiShen
    && pillar.diShi
    && pillar.xunKong
    && pillar.naYin
    && pillar.ganWuxing
    && pillar.zhiWuxing
  )));
  assert.ok(chart.yun.dayun.length > 0);
  assert.ok(chart.yun.dayun.every(({ index, ganZhi }) => index > 0 && ganZhi.length === 2));
  const currentDaYun = chart.yun.dayun.find(({ isCurrent }) => isCurrent);
  assert.ok(currentDaYun);
  assert.ok(currentDaYun.liuNian.some(({ year, isCurrent }) => year === 2026 && isCurrent));
  assert.match(chart.yun.startSolar, /^\d{4}-\d{2}-\d{2} /);
});

test('当前大运按交运时刻切换，流年按立春切换', () => {
  const input = {
    calendarType: 'solar',
    year: 1970,
    month: 7,
    day: 23,
    hourIndex: 4,
    gender: 'male',
  };
  const beforeDaYunBoundary = buildBaziChart(input, new Date(2025, 0, 1, 12));
  const afterDaYunBoundary = buildBaziChart(input, new Date(2025, 11, 31, 12));
  const beforeLiChun = buildBaziChart(input, new Date(2026, 1, 3, 12));
  const afterLiChun = buildBaziChart(input, new Date(2026, 1, 5, 12));

  assert.equal(beforeDaYunBoundary.yun.dayun.find(({ isCurrent }) => isCurrent).ganZhi, '戊子');
  assert.equal(afterDaYunBoundary.yun.dayun.find(({ isCurrent }) => isCurrent).ganZhi, '己丑');
  assert.equal(
    beforeLiChun.yun.dayun.flatMap(({ liuNian }) => liuNian).find(({ isCurrent }) => isCurrent).ganZhi,
    '乙巳',
  );
  assert.equal(
    beforeLiChun.yun.dayun.flatMap(({ liuNian }) => liuNian).filter(({ isCurrent }) => isCurrent).length,
    1,
  );
  assert.equal(
    afterLiChun.yun.dayun.flatMap(({ liuNian }) => liuNian).find(({ isCurrent }) => isCurrent).ganZhi,
    '丙午',
  );
});
