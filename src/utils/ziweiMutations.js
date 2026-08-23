import { util } from 'iztro';

export const MUTAGEN_META = Object.freeze([
  { key: 'lu', mutagen: '禄', color: '#18a05e' },
  { key: 'quan', mutagen: '权', color: '#8d3daf' },
  { key: 'ke', mutagen: '科', color: '#1686d9' },
  { key: 'ji', mutagen: '忌', color: '#ef3d35' },
]);

// iztro 默认采用《紫微斗数全书》的十干四化表。
export const MUTAGEN_STAR_MAP = Object.freeze({
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
});

export const getMutagenStarMap = (heavenlyStem) => {
  try {
    const stars = util.getMutagensByHeavenlyStem(heavenlyStem);
    return Object.fromEntries(MUTAGEN_META.map((meta, index) => (
      [meta.key, stars[index] || MUTAGEN_STAR_MAP[heavenlyStem]?.[meta.key] || '']
    )));
  } catch {
    return MUTAGEN_STAR_MAP[heavenlyStem] || {};
  }
};

export const getAllMutagenStarMaps = () => Object.fromEntries(
  Object.keys(MUTAGEN_STAR_MAP).map((heavenlyStem) => [heavenlyStem, getMutagenStarMap(heavenlyStem)]),
);

/**
 * Build the four palace-stem transformations for every palace.
 *
 * iztro only attaches the parent astrolabe when `astrolabe.palace(index)` is
 * called. Calling `mutagedPlaces()` directly on an item from
 * `astrolabe.palaces` therefore returns no useful destinations. Keep that
 * binding step here so every UI layer uses the same, reliable calculation.
 */
export const buildPalaceFlights = (astrolabe) => {
  if (!astrolabe?.palaces?.length) return [];

  return astrolabe.palaces.flatMap(({ index }) => {
    try {
      const source = astrolabe.palace(index);
      if (!source) return [];

      const opposite = astrolabe.surroundedPalaces(index)?.opposite;
      const targets = source?.mutagedPlaces?.() || [];
      const mutagenStars = util.getMutagensByHeavenlyStem(source.heavenlyStem);

      return MUTAGEN_META.map((meta, mutagenIndex) => {
        const target = targets[mutagenIndex];
        if (!target) return null;

        let kind = 'fly';
        if (target.index === source.index) kind = 'outward';
        else if (target.index === opposite?.index) kind = 'inward';

        return {
          ...meta,
          kind,
          starName: mutagenStars[mutagenIndex] || MUTAGEN_STAR_MAP[source.heavenlyStem]?.[meta.key] || '',
          sourceIndex: source.index,
          sourceName: source.name,
          sourceBranch: source.earthlyBranch,
          sourceStem: source.heavenlyStem,
          targetIndex: target.index,
          targetName: target.name,
          targetBranch: target.earthlyBranch,
        };
      }).filter(Boolean);
    } catch {
      return [];
    }
  });
};

export const groupSelfMutationsByBranch = (flights) => flights.reduce((result, flight) => {
  if (flight.kind !== 'outward' && flight.kind !== 'inward') return result;
  if (!result[flight.sourceBranch]) result[flight.sourceBranch] = [];
  result[flight.sourceBranch].push(flight);
  return result;
}, {});
