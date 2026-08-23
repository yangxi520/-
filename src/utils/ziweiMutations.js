export const MUTAGEN_META = Object.freeze([
  { key: 'lu', mutagen: '禄', color: '#18a05e' },
  { key: 'quan', mutagen: '权', color: '#8d3daf' },
  { key: 'ke', mutagen: '科', color: '#1686d9' },
  { key: 'ji', mutagen: '忌', color: '#ef3d35' },
]);

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
      const opposite = astrolabe.surroundedPalaces(index)?.opposite;
      const targets = source?.mutagedPlaces?.() || [];

      if (!source) return [];

      return MUTAGEN_META.map((meta, mutagenIndex) => {
        const target = targets[mutagenIndex];
        if (!target) return null;

        let kind = 'fly';
        if (target.index === source.index) kind = 'outward';
        else if (target.index === opposite?.index) kind = 'inward';

        return {
          ...meta,
          kind,
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
