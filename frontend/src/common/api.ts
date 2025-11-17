export interface NowResp {
  ts: number;
  ts_iso: string;
  co2_ppm: number;
  temperature_c: number;
  humidity_rh: number;
}
export type SeriesPoint = NowResp;

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
