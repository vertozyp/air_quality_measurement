export interface NowResp {
  ts: number;
  ts_iso: string;
  co2_ppm: number;
  temperature_c: number;
  humidity_rh: number;
}
export type SeriesPoint = NowResp;

export interface Thresholds {
  co2_ppm: number;
  humidity_pct: number;
}

const API_BASE = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000"
  : "";

export async function fetchNow(): Promise<NowResp> {
  const res = await fetch(`${API_BASE}/api/now`);
  if (!res.ok) throw new Error(`API /now -> ${res.status}`);
  return res.json();
}

export async function fetchSeries(
  sinceSeconds = 86400
): Promise<SeriesPoint[]> {
  const res = await fetch(
    `${API_BASE}/api/series?since_seconds=${sinceSeconds}`
  );
  if (!res.ok) throw new Error(`API /series -> ${res.status}`);
  return res.json();
}

export async function fetchThresholds(): Promise<Thresholds> {
  const res = await fetch(`${API_BASE}/api/thresholds`);
  if (!res.ok) throw new Error(`API /thresholds -> ${res.status}`);
  return res.json();
}

export async function updateThresholds(
  p: Partial<Thresholds>
): Promise<Thresholds> {
  const res = await fetch(`${API_BASE}/api/thresholds`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`API PUT /thresholds -> ${res.status}`);
  return res.json();
}
