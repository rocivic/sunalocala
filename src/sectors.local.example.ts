import type { SectorNumber } from './sectors';

// Copy this file to sectors.local.ts (gitignored) to use mock phone numbers locally
// instead of the real dispatch lines in sectors.ts. Only num/alt can be overridden.
export const SECTOR_OVERRIDES: Partial<
  Record<SectorNumber, { num: string; alt?: string }>
> = {
  1: { num: '0700 000 001' },
  2: { num: '0700 000 002' },
  3: { num: '0700 000 003' },
  4: { num: '0700 000 004' },
  5: { num: '0700 000 005', alt: '0700 000 015' },
  6: { num: '0700 000 006' },
};
