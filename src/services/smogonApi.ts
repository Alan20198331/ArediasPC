// Simple fetch service that retrieves data from data.pkmn.cc which hosts compiled Smogon statistics and sets

export interface SmogonMoveset {
  moves: string[];
  item?: string;
  ability?: string;
  nature?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
}

export interface SmogonFormatData {
  [pokemonName: string]: {
    [setName: string]: SmogonMoveset;
  };
}

export interface SmogonSearchResult {
  sets: Record<string, SmogonMoveset>;
  formatUsed: string;
  generationUsed: number;
  isFromPreviousGen: boolean;
}

const CACHE: Record<string, SmogonFormatData> = {};

// Tier priority (Singles)
const TIER_PRIORITY = [
  'uber',
  'ou',
  'uu',
  'ru',
  'nu',
  'pu',
  'zu',
  'lc'
];

// Doubles/VGC priority
const DOUBLES_PRIORITY = [
  'doublesou',
  'vgc'
];

// -----------------------------
// Fetch all sets for a format
// -----------------------------
export const fetchSmogonSets = async (format: string = "gen9ou"): Promise<SmogonFormatData> => {
  if (CACHE[format]) {
    return CACHE[format];
  }

  try {
    const response = await fetch(`https://data.pkmn.cc/sets/${format}.json`);

    if (!response.ok) {
      console.warn(`Format ${format} not found in smogon dump`);
      return {};
    }

    const data = await response.json();
    CACHE[format] = data;
    return data;

  } catch (error) {
    console.error("Failed to fetch smogon sets:", error);
    return {};
  }
};

// -----------------------------
// Get sets for specific pokemon
// -----------------------------
export const getSetsForPokemon = async (
  format: string,
  pokemonName: string
): Promise<Record<string, SmogonMoveset>> => {

  const allSets = await fetchSmogonSets(format);

  const normalizedKeys = Object.keys(allSets).reduce((acc: any, key) => {
    acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = key;
    return acc;
  }, {});

  const lookupKey = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const realKey = normalizedKeys[lookupKey];

  if (realKey && allSets[realKey]) {
    return allSets[realKey];
  }

  return {};
};

// -----------------------------
// Build formats to try
// -----------------------------
const buildFormatsToTry = (
  generation: number,
  baseFormat: string
): { format: string; gen: number }[] => {

  const formats: { format: string; gen: number }[] = [];

  for (let gen = generation; gen >= 1; gen--) {
    const prefix = `gen${gen}`;

    const tiers =
      baseFormat === 'ou'
        ? TIER_PRIORITY
        : baseFormat === 'doublesou'
          ? DOUBLES_PRIORITY
          : [baseFormat];

    for (const tier of tiers) {
      formats.push({
        format: `${prefix}${tier}`,
        gen
      });
    }
  }

  return formats;
};

// -----------------------------
// Main smart search function
// -----------------------------
export const getBestAvailableSet = async (
  generation: number,
  baseFormat: string,
  pokemonName: string
): Promise<SmogonSearchResult | null> => {

  const formatsToTry = buildFormatsToTry(generation, baseFormat);

  for (const { format, gen } of formatsToTry) {
    const sets = await getSetsForPokemon(format, pokemonName);

    if (Object.keys(sets).length > 0) {
      return {
        sets,
        formatUsed: format,
        generationUsed: gen,
        isFromPreviousGen: gen !== generation
      };
    }
  }

  return null;
};