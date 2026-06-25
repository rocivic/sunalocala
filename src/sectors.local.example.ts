import type { Sector, SectorNumber } from './sectors';

// Copy this file to sectors.local.ts (gitignored) to use mock contacts locally
// instead of the real dispatch lines in sectors.ts. Only `contacts` can be overridden.
// Set VITE_MOCK_SECTORS=true (e.g. in .env.local) to activate it.
export const SECTOR_OVERRIDES: Partial<Record<SectorNumber, Pick<Sector, 'contacts'>>> = {
  1: { contacts: [{ type: 'phone', value: '0700 000 001' }] },
  2: { contacts: [{ type: 'phone', value: '0700 000 002' }] },
  3: { contacts: [{ type: 'phone', value: '0700 000 003' }] },
  4: { contacts: [{ type: 'phone', value: '0700 000 004' }] },
  5: {
    contacts: [
      { type: 'phone', value: '0700 000 005' },
      { type: 'phone', value: '0700 000 015', label: 'Linie alternativă' },
    ],
  },
  6: { contacts: [{ type: 'phone', value: '0700 000 006' }] },
};
