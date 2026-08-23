import { astro } from 'iztro';

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);
const YIN_STEMS = new Set(['乙', '丁', '己', '辛', '癸']);

const toIztroGender = (gender) => (
  gender === 'female' || gender === '女' ? '女' : '男'
);

export const createZiweiHoroscope = ({
  calendarType = 'solar',
  birthDate,
  timeIndex,
  gender,
  isLeapMonth = false,
}) => {
  const iztroGender = toIztroGender(gender);

  if (calendarType === 'lunar') {
    return astro.byLunar(
      birthDate,
      Number(timeIndex),
      iztroGender,
      Boolean(isLeapMonth),
      true,
      'zh-CN',
    );
  }

  return astro.bySolar(
    birthDate,
    Number(timeIndex),
    iztroGender,
    true,
    'zh-CN',
  );
};

export const getYinYangGenderLabel = (horoscope, gender) => {
  const rawYearStem = horoscope?.rawDates?.chineseDate?.yearly?.[0];
  const formattedYearStem = typeof horoscope?.chineseDate === 'string'
    ? horoscope.chineseDate.trim()[0]
    : '';
  const yearStem = rawYearStem || formattedYearStem;
  const genderLabel = toIztroGender(gender);

  if (YANG_STEMS.has(yearStem)) return `阳${genderLabel}`;
  if (YIN_STEMS.has(yearStem)) return `阴${genderLabel}`;
  return genderLabel;
};
