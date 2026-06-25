import {
  SECTORS,
  SECTOR_NUMBERS,
  primaryPhone,
  type Contact,
  type ContactType,
  type SectorNumber,
} from './sectors';

interface NominatimAddress {
  city_district?: string;
  suburb?: string;
  district?: string;
  quarter?: string;
  borough?: string;
  county?: string;
  municipality?: string;
  neighbourhood?: string;
  region?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  display_name?: string;
}

function tel(s: string): string {
  return 'tel:' + s.replace(/\s+/g, '');
}

// ---------- contact rendering ----------
const CONTACT_LABELS: Record<ContactType, string> = {
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  email: 'Email',
};

// Inline outline icons (24x24 viewBox), one per contact type, drawn into the
// accent-colored ring of each contact card.
const CONTACT_ICON_PATHS: Record<ContactType, string> = {
  phone:
    '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  whatsapp:
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  facebook:
    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  email:
    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
};

function contactIconSvg(type: ContactType): string {
  return (
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    CONTACT_ICON_PATHS[type] +
    '</svg>'
  );
}

function contactHref(c: Contact): string {
  switch (c.type) {
    case 'phone':
      return tel(c.value);
    case 'whatsapp': {
      // wa.me needs an international number; `value` is stored in local
      // Romanian format (leading 0), so swap it for the +40 country code.
      const digits = c.value.replace(/\D/g, '').replace(/^0/, '40');
      return (
        'https://wa.me/' +
        digits +
        (c.message ? '?text=' + encodeURIComponent(c.message) : '')
      );
    }
    case 'facebook':
      return c.value;
    case 'email':
      return 'mailto:' + c.value;
  }
}

function renderContacts(contacts: Contact[], container: HTMLElement): void {
  container.innerHTML = '';
  contacts.forEach((c, i) => {
    const a = document.createElement('a');
    a.className =
      'r-contact' + (i === 0 ? ' r-contact--primary' : ' r-contact--secondary');
    a.href = contactHref(c);
    if (c.type === 'facebook') {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.innerHTML =
      '<span class="r-contact-text">' +
      '<span class="r-contact-label">' +
      (c.label ?? CONTACT_LABELS[c.type]) +
      '</span>' +
      '<span class="r-contact-value">' +
      c.value +
      '</span>' +
      '</span>' +
      '<span class="ring" aria-hidden="true">' +
      contactIconSvg(c.type) +
      '</span>';
    container.appendChild(a);
  });
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

// ---------- temporary geolocation diagnostics ----------
// Logs geolocation/permission events to the console, enabled only in the
// Vite dev build so it stays quiet for real users in production. Lets us see
// what Android actually reports back from getCurrentPosition. Remove once the
// Android detection issue is understood.
const DEBUG = import.meta.env.DEV;
const dbgStart = Date.now();

function dbg(msg: string): void {
  if (!DEBUG) return;
  const t = ((Date.now() - dbgStart) / 1000).toFixed(2);
  console.log(`[geo] +${t}s  ${msg}`);
}

// ---------- theme ----------
// VITE_THEME=new switches to the newer brand color; default/unset uses the legacy one.
if (import.meta.env.VITE_THEME === 'new') {
  const root = document.documentElement.style;
  root.setProperty('--civic', 'var(--civic-new)');
  root.setProperty('--civic-press', 'var(--civic-new-press)');
}

// ---------- sector cache ----------
const SECTOR_CACHE_KEY = 'sunalocala:sector';
const SECTOR_CACHE_TTL_MS = 60 * 1000;

interface SectorCacheEntry {
  sector: SectorNumber;
  timestamp: number;
}

function readSectorCache(): SectorNumber | null {
  try {
    const raw = localStorage.getItem(SECTOR_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as SectorCacheEntry;
    if (Date.now() - entry.timestamp > SECTOR_CACHE_TTL_MS) return null;
    if (!SECTOR_NUMBERS.includes(entry.sector)) return null;
    return entry.sector;
  } catch {
    return null;
  }
}

function writeSectorCache(sector: SectorNumber): void {
  try {
    const entry: SectorCacheEntry = { sector, timestamp: Date.now() };
    localStorage.setItem(SECTOR_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore (e.g. storage disabled/full)
  }
}

type ScreenName = 'status' | 'result' | 'manual';

const screens: Record<ScreenName, HTMLElement> = {
  status: byId('status'),
  result: byId('result'),
  manual: byId('manual'),
};

// "status" is a transient loading/error overlay, not a navigable
// destination, so it never gets its own history entry — only "manual"
// and "result" do. That way the device back gesture/button (iOS swipe,
// Android back) steps between actual destinations instead of landing
// on a frozen spinner.
type DestScreen = 'manual' | 'result';

interface NavState {
  screen: DestScreen;
  sector: SectorNumber | null;
}

let currentDest: DestScreen | null = null;
let currentSector: SectorNumber | null = null;

function applyScreen(name: ScreenName): void {
  // Built lazily so the landing experience is just the loading state — the
  // grid is only constructed the first time the manual screen is shown.
  if (name === 'manual') buildGrid();
  (Object.keys(screens) as ScreenName[]).forEach((k) => {
    screens[k].classList.toggle('is-active', k === name);
  });
}

function show(name: ScreenName): void {
  applyScreen(name);
}

// Navigates to a "real" destination screen, recording it in history.
function navigate(name: DestScreen, sector: SectorNumber | null = null): void {
  if (currentDest === name && currentSector === sector) {
    applyScreen(name);
    return;
  }
  const isFirst = currentDest === null;
  currentDest = name;
  currentSector = sector;
  if (isFirst) {
    history.replaceState(
      { screen: name, sector } as NavState,
      '',
      location.href,
    );
  } else {
    history.pushState({ screen: name, sector } as NavState, '', location.href);
  }
  applyScreen(name);
}

window.addEventListener('popstate', (e) => {
  const state = e.state as NavState | null;
  if (!state) {
    // Back past the first recorded destination: let the browser leave the app.
    return;
  }
  currentDest = state.screen;
  currentSector = state.sector;
  if (state.screen === 'result' && state.sector) {
    renderResultContent(state.sector);
  }
  applyScreen(state.screen);
});

// ---------- result rendering ----------
function renderResultContent(n: SectorNumber): void {
  const s = SECTORS[n];
  if (!s) return;

  const card = byId<HTMLElement>('card');
  card.style.setProperty('--accent', s.accent);
  byId('ghostNum').textContent = String(n);
  byId('rSector').textContent = 'Sectorul ' + n;
  renderContacts(s.contacts, byId<HTMLElement>('rContacts'));
}

function renderResult(n: SectorNumber, cacheResult = true): void {
  if (!SECTORS[n]) return;
  if (cacheResult) writeSectorCache(n);
  renderResultContent(n);
  navigate('result', n);
}

// ---------- status helpers ----------
const statusEl = byId<HTMLElement>('status');
const statusMsg = byId<HTMLElement>('statusMsg');

function detecting(): void {
  statusEl.classList.remove('is-error');
  statusMsg.textContent = 'Se detectează locația…';
  show('status');
}

function detectError(msg: string): void {
  statusEl.classList.add('is-error');
  statusMsg.textContent = msg;
  show('status');
}

// ---------- geolocation + reverse geocode ----------
function parseSector(data: NominatimResponse): SectorNumber | null {
  const a = data.address || {};
  const fields: (keyof NominatimAddress)[] = [
    'city_district',
    'suburb',
    'district',
    'quarter',
    'borough',
    'county',
    'municipality',
    'neighbourhood',
    'region',
  ];
  const pool: string[] = [];
  fields.forEach((f) => {
    if (a[f]) pool.push(String(a[f]));
  });
  if (data.display_name) pool.push(String(data.display_name));

  for (const entry of pool) {
    const m = entry.match(/sector(?:ul)?\s*0*([1-6])\b/i);
    if (m) return parseInt(m[1], 10) as SectorNumber;
  }
  return null;
}

function inBucharest(data: NominatimResponse): boolean {
  const blob = (
    JSON.stringify(data.address || {}) +
    ' ' +
    (data.display_name || '')
  ).toLowerCase();
  return /bucure[sş]ti|bucharest/.test(blob);
}

// TIMEOUT / POSITION_UNAVAILABLE are transient (slow fix), so retry a few
// times before giving up; PERMISSION_DENIED is final and never retried.
const GEO_MAX_RETRIES = 2;

function onGeoSuccess(pos: GeolocationPosition): void {
  dbg(
    `success: lat=${pos.coords.latitude.toFixed(5)} lon=${pos.coords.longitude.toFixed(5)} acc=${Math.round(pos.coords.accuracy)}m`,
  );
  updateGeoWarning(false);
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=19&addressdetails=1&accept-language=ro&lat=' +
    lat +
    '&lon=' +
    lon;
  fetch(url, { headers: { Accept: 'application/json' } })
    .then((r) => {
      if (!r.ok) throw new Error('geocode');
      return r.json() as Promise<NominatimResponse>;
    })
    .then((data) => {
      const n = parseSector(data);
      if (n) {
        renderResult(n);
        return;
      }
      if (!inBucharest(data)) {
        detectError(
          'Se pare că nu ești în București. Această aplicație acoperă doar sectoarele Bucureștiului.',
        );
      } else {
        detectError(
          'Nu am putut determina sectorul exact. Alege-l manual mai jos.',
        );
      }
    })
    .catch(() => {
      detectError(
        'Nu am putut verifica locația. Verifică conexiunea sau alege sectorul manual.',
      );
    });
}

function onGeoError(err: GeolocationPositionError, attempt: number): void {
  dbg(`error: code=${err && err.code} message=${err && err.message}`);
  if (err && err.code === 1) {
    // PERMISSION_DENIED — final, don't retry.
    updateGeoWarning(true);
    navigate('manual');
    return;
  }
  if (attempt < GEO_MAX_RETRIES) {
    dbg(`retrying geolocation (attempt ${attempt + 1}/${GEO_MAX_RETRIES})`);
    requestPosition(attempt + 1);
    return;
  }
  detectError('Nu am reușit să obțin locația. Alege sectorul manual.');
}

function requestPosition(attempt: number): void {
  // Call getCurrentPosition synchronously: Android Chrome auto-denies a
  // permission prompt that isn't initiated in the page-load task, so we must
  // not defer it behind a promise. The timeout is chosen from the permission
  // state cached by watchGeoPermission instead of an awaited query.
  dbg(`getCurrentPosition: start (attempt=${attempt}))`);
  navigator.geolocation.getCurrentPosition(
    onGeoSuccess,
    (err) => onGeoError(err, attempt),
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 },
  );
}

function detect(force = false): void {
  dbg(`detect(force=${force}) called`);
  if (!force) {
    const cached = readSectorCache();
    if (cached) {
      dbg(`using cached sector ${cached}, skipping geolocation`);
      renderResult(cached, false);
      return;
    }
  }
  if (!('geolocation' in navigator)) {
    dbg('no geolocation API → manual');
    navigate('manual');
    return;
  }
  detecting();
  requestPosition(0);
}

function updateGeoWarning(denied: boolean): void {
  const blocked = denied;
  byId<HTMLButtonElement>('detectAgainBtn').disabled = blocked;
  byId('geoWarn').hidden = !blocked;
  byId<HTMLElement>('geoTip').tabIndex = blocked ? 0 : -1;
  if (!blocked) setGeoTipOpen(false);
}

// Decides the landing screen and keeps geolocation permission state current.
// querying the Permissions API reports the state (granted/denied/prompt)
// *without* prompting, so a returning visitor who already allowed location
// jumps straight to auto-detection, while everyone else lands on the manual
// picker and opts in via the "Detectează sectorul" button. Falls back to the
// manual picker when the Permissions API is unavailable (e.g. older Safari).
function start(): void {
  if (!('permissions' in navigator) || !('geolocation' in navigator)) {
    navigate('manual');
    return;
  }
  navigator.permissions
    .query({ name: 'geolocation' })
    .then((status) => {
      dbg(`permissions.query: ${status.state}`);
      updateGeoWarning(status.state === 'denied');
      if (status.state === 'granted') {
        detect();
      } else {
        navigate('manual');
      }
    })
    .catch((e) => {
      dbg(`permissions.query failed: ${e}`);
      navigate('manual');
    });
}

// ---------- manual picker ----------
let gridBuilt = false;

function buildGrid(): void {
  if (gridBuilt) return;
  gridBuilt = true;
  const grid = byId<HTMLElement>('grid');
  const frag = document.createDocumentFragment();
  SECTOR_NUMBERS.forEach((n) => {
    const s = SECTORS[n];
    const phone = primaryPhone(s) ?? '';
    const b = document.createElement('button');
    b.className = 'sec-btn';
    b.style.setProperty('--accent', s.accent);
    b.setAttribute('aria-label', 'Sectorul ' + n + ', Poliția Locală ' + phone);
    b.innerHTML =
      '<span class="badge" aria-hidden="true">' +
      n +
      '</span><span class="lbl">Sectorul ' +
      n +
      '</span><span class="ph">' +
      phone +
      '</span>';
    b.addEventListener('click', () => renderResult(n));
    frag.appendChild(b);
  });
  grid.appendChild(frag);
}

// ---------- wire up ----------
// Tooltip visibility is driven entirely from JS (not :hover/:focus-within)
// because a disabled <button> can't reliably receive hover/focus across
// browsers, and touch devices have no hover at all.
const geoTip = byId<HTMLElement>('geoTip');

function setGeoTipOpen(open: boolean): void {
  geoTip.classList.toggle('is-open', open && !byId('geoWarn').hidden);
}

geoTip.addEventListener('pointerenter', (e) => {
  if (e.pointerType === 'mouse') setGeoTipOpen(true);
});
geoTip.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse') setGeoTipOpen(false);
});
geoTip.addEventListener('focusin', () => setGeoTipOpen(true));
geoTip.addEventListener('focusout', () => setGeoTipOpen(false));
geoTip.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    setGeoTipOpen(!geoTip.classList.contains('is-open'));
  }
});
document.addEventListener('pointerdown', (e) => {
  if (!geoTip.contains(e.target as Node)) setGeoTipOpen(false);
});

byId('retryBtn').addEventListener('click', () => detect(true));
byId('errManual').addEventListener('click', () => navigate('manual'));
byId('changeBtn').addEventListener('click', () => navigate('manual'));
byId('detectAgainBtn').addEventListener('click', () => detect(true));

start();
