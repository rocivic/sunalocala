export type SectorNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface Sector {
  num: string;
  accent: string;
  alt?: string;
}

// Dispecerat Poliția Locală — număr per sector (verificat din surse oficiale ale primăriilor de sector)
export const SECTORS: Record<SectorNumber, Sector> = {
  1: { num: "021 9540", accent: "var(--s1)" },
  2: { num: "021 9941", accent: "var(--s2)" },
  3: { num: "021 9543", accent: "var(--s3)" },
  4: { num: "021 9441", accent: "var(--s4)" },
  5: { num: "031 9451", accent: "var(--s5)", alt: "031 9885" },
  6: { num: "021 9546", accent: "var(--s6)" },
};

export const SECTOR_NUMBERS: SectorNumber[] = [1, 2, 3, 4, 5, 6];
