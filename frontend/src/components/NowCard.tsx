import type { NowResp } from "../common/api";

export default function NowCard({ now }: { now: NowResp | null }) {
  if (!now) return <div className="card">Načítám aktuální hodnoty…</div>;
  const d = new Date(now.ts_iso);
  return (
    <div className="card">
      <div style={{ fontSize: 14, color: "#666" }}>
        Poslední vzorek: {d.toLocaleString()}
      </div>
      <div className="metrics">
        <Metric label="CO₂" value={`${Math.round(now.co2_ppm)} ppm`} />
        <Metric label="Teplota" value={`${now.temperature_c.toFixed(1)} °C`} />
        <Metric label="Vlhkost" value={`${now.humidity_rh.toFixed(0)} %`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
    </div>
  );
}
