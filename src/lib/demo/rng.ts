// Deterministic random numbers: the same seed always yields the same demo data,
// so a demo account looks identical on every visit and every rehearsal.

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  /** Rounded to the nearest `step` (e.g. 50 TL). */
  amount(min: number, max: number, step: number): number;
}

export function createRng(seed: string): Rng {
  let state = hashSeed(seed);
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: <T,>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error("pick from empty list");
      return items[Math.floor(next() * items.length)] as T;
    },
    chance: (p: number) => next() < p,
    amount: (min: number, max: number, step: number) => {
      // Skewed towards smaller amounts, like real invoice books.
      const skew = next() ** 2;
      return Math.round((min + skew * (max - min)) / step) * step;
    },
  };
}

const SYLLABLES = ["ka", "ve", "ra", "mo", "lin", "ta", "sel", "do", "na", "ri", "zen", "ko", "bel", "ar", "nu", "tem", "si", "ló", "da", "vo"] as const;

/** An invented brand word (e.g. "Kavera"), so demo names never point at a real firm. */
export function brandWord(rng: Rng): string {
  const parts = rng.int(2, 3);
  let word = "";
  for (let i = 0; i < parts; i++) word += rng.pick(SYLLABLES);
  word = word.replace("ó", "o");
  return word.charAt(0).toUpperCase() + word.slice(1);
}
