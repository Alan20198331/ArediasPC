export interface PokemonListResult {
  name: string;
  url: string;
  id: number;
  num?: number;
  formCategory?: string;
  tier?: string;
  doublesTier?: string;
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonSprites {
  front_default: string;
  other: {
    "official-artwork": {
      front_default: string;
    }
  }
}

export interface PokemonDetails {
  id: number;
  name: string;
  sprites: PokemonSprites;
  types: PokemonType[];
  stats: {
    base_stat: number;
    stat: { name: string; url: string };
  }[];
}

export interface DamageRelations {
  double_damage_from: { name: string }[];
  double_damage_to: { name: string }[];
  half_damage_from: { name: string }[];
  half_damage_to: { name: string }[];
  no_damage_from: { name: string }[];
  no_damage_to: { name: string }[];
}

export const GENERATIONS = [
  { gen: 1, name: "Generation I", maxId: 151, smogonFormat: "gen1ou" },
  { gen: 2, name: "Generation II", maxId: 251, smogonFormat: "gen2ou" },
  { gen: 3, name: "Generation III", maxId: 386, smogonFormat: "gen3ou" },
  { gen: 4, name: "Generation IV", maxId: 493, smogonFormat: "gen4ou" },
  { gen: 5, name: "Generation V", maxId: 649, smogonFormat: "gen5ou" },
  { gen: 6, name: "Generation VI", maxId: 721, smogonFormat: "gen6ou" },
  { gen: 7, name: "Generation VII", maxId: 809, smogonFormat: "gen7ou" },
  { gen: 8, name: "Generation VIII", maxId: 898, smogonFormat: "gen8ou" },
  { gen: 9, name: "Generation IX", maxId: 1025, smogonFormat: "gen9ou" }
];

export const fetchPokemonList = async (): Promise<PokemonListResult[]> => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=100000`);
  const data = await response.json();
  return data.results.map((p: any) => {
    const parts = p.url.split('/');
    const id = parseInt(parts[parts.length - 2], 10);
    return {
      ...p,
      id
    };
  });
};

export const fetchPokemonDetails = async (idOrName: string | number): Promise<PokemonDetails> => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
  return response.json();
};

export const fetchTypeData = async (typeName: string): Promise<DamageRelations> => {
  const response = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
  const data = await response.json();
  return data.damage_relations;
};
