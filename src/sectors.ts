export type SectorNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface Sector {
  num: string;
  accent: string;
  alt?: string;
}

type SectorOverrides = Partial<Record<SectorNumber, Pick<Sector, 'num' | 'alt'>>>;

export const SECTOR_NUMBERS: SectorNumber[] = [1, 2, 3, 4, 5, 6];

// Dispecerat Poliția Locală — număr per sector (verificat din surse oficiale ale primăriilor de sector)
const BASE_SECTORS: Record<SectorNumber, Sector> = {
  1: { num: '021 9540', accent: 'var(--s1)' },
  2: { num: '021 9941', accent: 'var(--s2)' },
  3: { num: '021 9543', accent: 'var(--s3)' },
  4: { num: '021 9441', accent: 'var(--s4)' },
  5: { num: '031 9451', accent: 'var(--s5)', alt: '031 9885' },
  6: { num: '021 9546', accent: 'var(--s6)' },
};

// Optional gitignored override file for local dev — copy sectors.local.example.ts to
// sectors.local.ts and fill in mock numbers. Absent for everyone else, so this glob
// resolves to {} rather than a missing-module error. Gated on DEV so Rollup dead-code
// eliminates this whole block from production builds, even if the file exists on disk.
let overrides: SectorOverrides = {};
if (import.meta.env.DEV) {
  const localOverrideModules = import.meta.glob('./sectors.local.ts', { eager: true }) as Record<
    string,
    { SECTOR_OVERRIDES?: SectorOverrides }
  >;
  overrides = Object.values(localOverrideModules)[0]?.SECTOR_OVERRIDES ?? {};
}

export const SECTORS: Record<SectorNumber, Sector> = Object.fromEntries(
  SECTOR_NUMBERS.map((n) => [n, { ...BASE_SECTORS[n], ...overrides[n] }])
) as Record<SectorNumber, Sector>;
