export type SectorNumber = 1 | 2 | 3 | 4 | 5 | 6;

// Channel a sector can be reached through. Only 'phone' has real data today;
// the rest are plumbed through end-to-end (types, icons, rendering) so a
// WhatsApp/Facebook/email contact can be dropped into BASE_SECTORS later
// without touching anything outside this file.
export type ContactType = 'phone' | 'whatsapp' | 'facebook' | 'email';

export interface Contact {
  type: ContactType;
  /** Phone number, full profile URL, or email address, depending on `type`. */
  value: string;
  /** Overrides the default per-type label (e.g. "Linie alternativă"). */
  label?: string;
  /** WhatsApp only: pre-filled message text for the wa.me deep link. */
  message?: string;
}

export interface Sector {
  accent: string;
  contacts: Contact[];
}

type SectorOverrides = Partial<Record<SectorNumber, Pick<Sector, 'contacts'>>>;

export const SECTOR_NUMBERS: SectorNumber[] = [1, 2, 3, 4, 5, 6];

// Dispecerat Poliția Locală — număr per sector (verificat din surse oficiale ale primăriilor de sector)
const BASE_SECTORS: Record<SectorNumber, Sector> = {
  1: {
    accent: 'var(--s1)',
    contacts: [
      { type: 'phone', value: '021 9540' },
      // {
      //   type: 'whatsapp',
      //   value: '+40 745 093 940',
      //   message: 'Bună ziua, aș dori să raportez o problemă în Sectorul 1.',
      // },
    ],
  },
  2: { accent: 'var(--s2)', contacts: [{ type: 'phone', value: '021 9941' }] },
  3: { accent: 'var(--s3)', contacts: [{ type: 'phone', value: '021 9543' }] },
  4: { accent: 'var(--s4)', contacts: [{ type: 'phone', value: '021 9441' }] },
  5: {
    accent: 'var(--s5)',
    contacts: [
      { type: 'phone', value: '031 9451' },
      { type: 'phone', value: '031 9885', label: 'Linie alternativă' },
    ],
  },
  6: { accent: 'var(--s6)', contacts: [{ type: 'phone', value: '021 9546' }] },
};

// Optional gitignored override file for local dev — copy sectors.local.example.ts to
// sectors.local.ts and fill in mock numbers, then set VITE_MOCK_SECTORS=true (e.g. in
// .env.local) to activate it. The file can stay on disk without silently overriding
// real data on every dev run. The glob resolves to {} when the file is absent, so this
// works even before you've copied it. Gated on DEV so Rollup dead-code eliminates this
// whole block from production builds, even if the file exists on disk.
let overrides: SectorOverrides = {};
if (import.meta.env.DEV && import.meta.env.VITE_MOCK_SECTORS === 'true') {
  const localOverrideModules = import.meta.glob('./sectors.local.ts', {
    eager: true,
  }) as Record<string, { SECTOR_OVERRIDES?: SectorOverrides }>;
  overrides = Object.values(localOverrideModules)[0]?.SECTOR_OVERRIDES ?? {};
}

export const SECTORS: Record<SectorNumber, Sector> = Object.fromEntries(
  SECTOR_NUMBERS.map((n) => [n, { ...BASE_SECTORS[n], ...overrides[n] }]),
) as Record<SectorNumber, Sector>;

/** First phone contact for a sector, for places that only show one number (e.g. the manual grid). */
export function primaryPhone(s: Sector): string | undefined {
  return s.contacts.find((c) => c.type === 'phone')?.value;
}
