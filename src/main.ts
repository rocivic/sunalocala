import { SECTORS, SECTOR_NUMBERS, type SectorNumber } from "./sectors";

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
  return "tel:" + s.replace(/\s+/g, "");
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

// ---------- sector cache ----------
const SECTOR_CACHE_KEY = "sunalocala:sector";
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

type ScreenName = "status" | "result" | "manual";

const screens: Record<ScreenName, HTMLElement> = {
  status: byId("status"),
  result: byId("result"),
  manual: byId("manual"),
};

function show(name: ScreenName): void {
  (Object.keys(screens) as ScreenName[]).forEach((k) => {
    screens[k].classList.toggle("is-active", k === name);
  });
}

// ---------- result rendering ----------
function renderResult(n: SectorNumber, cacheResult = true): void {
  const s = SECTORS[n];
  if (!s) return;

  if (cacheResult) writeSectorCache(n);

  const card = byId<HTMLElement>("card");
  card.style.setProperty("--accent", s.accent);
  byId("ghostNum").textContent = String(n);
  byId("rSector").textContent = "Sectorul " + n;
  byId("rNum").textContent = s.num;
  byId<HTMLAnchorElement>("callLink").setAttribute("href", tel(s.num));

  const alt = byId<HTMLElement>("rAlt");
  if (s.alt) {
    alt.hidden = false;
    alt.innerHTML = 'Linie alternativă: <a href="' + tel(s.alt) + '">' + s.alt + "</a>";
  } else {
    alt.hidden = true;
    alt.innerHTML = "";
  }
  show("result");
}

// ---------- status helpers ----------
const statusEl = byId<HTMLElement>("status");
const statusMsg = byId<HTMLElement>("statusMsg");

function detecting(): void {
  statusEl.classList.remove("is-error");
  statusMsg.textContent = "Se detectează locația…";
  show("status");
}

function detectError(msg: string): void {
  statusEl.classList.add("is-error");
  statusMsg.textContent = msg;
  show("status");
}

// ---------- geolocation + reverse geocode ----------
function parseSector(data: NominatimResponse): SectorNumber | null {
  const a = data.address || {};
  const fields: (keyof NominatimAddress)[] = [
    "city_district",
    "suburb",
    "district",
    "quarter",
    "borough",
    "county",
    "municipality",
    "neighbourhood",
    "region",
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
  const blob = (JSON.stringify(data.address || {}) + " " + (data.display_name || "")).toLowerCase();
  return /bucure[sş]ti|bucharest/.test(blob);
}

function detect(force = false): void {
  if (!force) {
    const cached = readSectorCache();
    if (cached) {
      renderResult(cached, false);
      return;
    }
  }
  if (!("geolocation" in navigator)) {
    show("manual");
    return;
  }
  detecting();
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const url =
        "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=ro&lat=" +
        lat +
        "&lon=" +
        lon;
      fetch(url, { headers: { Accept: "application/json" } })
        .then((r) => {
          if (!r.ok) throw new Error("geocode");
          return r.json() as Promise<NominatimResponse>;
        })
        .then((data) => {
          const n = parseSector(data);
          if (n) {
            renderResult(n);
            return;
          }
          if (!inBucharest(data)) {
            detectError("Se pare că nu ești în București. Această aplicație acoperă doar sectoarele Bucureștiului.");
          } else {
            detectError("Nu am putut determina sectorul exact. Alege-l manual mai jos.");
          }
        })
        .catch(() => {
          detectError("Nu am putut verifica locația. Verifică conexiunea sau alege sectorul manual.");
        });
    },
    (err) => {
      if (err && err.code === 1) {
        show("manual");
        return;
      }
      detectError("Nu am reușit să obțin locația. Alege sectorul manual.");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

// ---------- geolocation permission state ----------
function updateGeoWarning(denied: boolean): void {
  byId<HTMLButtonElement>("detectAgainBtn").disabled = denied;
  byId("geoWarn").hidden = !denied;
}

function watchGeoPermission(): void {
  if (!("permissions" in navigator)) return;
  navigator.permissions
    .query({ name: "geolocation" })
    .then((status) => {
      updateGeoWarning(status.state === "denied");
      status.addEventListener("change", () => updateGeoWarning(status.state === "denied"));
    })
    .catch(() => {});
}

// ---------- manual picker ----------
function buildGrid(): void {
  const grid = byId<HTMLElement>("grid");
  const frag = document.createDocumentFragment();
  SECTOR_NUMBERS.forEach((n) => {
    const s = SECTORS[n];
    const b = document.createElement("button");
    b.className = "sec-btn";
    b.style.setProperty("--accent", s.accent);
    b.setAttribute("aria-label", "Sectorul " + n + ", Poliția Locală " + s.num);
    b.innerHTML =
      '<span class="badge" aria-hidden="true">' +
      n +
      '</span><span class="lbl">Sectorul ' +
      n +
      '</span><span class="ph">' +
      s.num +
      "</span>";
    b.addEventListener("click", () => renderResult(n));
    frag.appendChild(b);
  });
  grid.appendChild(frag);
}

// ---------- wire up ----------
byId("retryBtn").addEventListener("click", () => detect(true));
byId("errManual").addEventListener("click", () => show("manual"));
byId("changeBtn").addEventListener("click", () => show("manual"));
byId("detectAgainBtn").addEventListener("click", () => detect(true));

buildGrid();
watchGeoPermission();
detect();
