import { useEffect, useState } from "react";
import {
  fetchNow,
  fetchSeries,
  type NowResp,
  type SeriesPoint,
} from "./common/api";
import NowCard from "./components/NowCard";
import CO2Chart from "./components/CO2Chart";
import HumidityChart from "./components/HumidityChart";

export default function App() {
  const [now, setNow] = useState<NowResp | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadInitial() {
      try {
        const [n, s] = await Promise.all([fetchNow(), fetchSeries(24 * 3600)]);
        if (!alive) return;
        setNow(n);
        setSeries(s);
      } catch (e) {
        setErr(String(e));
      }
    }
    loadInitial();
    const tNow = window.setInterval(async () => {
      try {
        if (!alive) return;
        setNow(await fetchNow());
      } catch {
        setErr("Failed to fetch current data");
      }
    }, 10_000);
    const tSeries = window.setInterval(async () => {
      try {
        if (!alive) return;
        setSeries(await fetchSeries(24 * 3600));
      } catch {
        setErr("Failed to fetch series data");
      }
    }, 60_000);
    return () => {
      alive = false;
      window.clearInterval(tNow);
      window.clearInterval(tSeries);
    };
  }, []);

  return (
    <div className="app">
      <h1 className="title">Kvalita vzduchu – CO₂ monitor</h1>
      {err && (
        <div
          className="card"
          style={{ background: "#fee", borderColor: "#f99", color: "#111" }}
        >
          Chyba: {err}
        </div>
      )}

      <NowCard now={now} />

      <div className="grow charts">
        {/* CO₂ graf */}
        <div className="card chartCard">
          <div className="chartHeader">CO₂ (ppm) – posledních 24 h</div>
          <CO2Chart data={series} />
        </div>

        {/* Vlhkost graf */}
        <div className="card chartCard">
          <div className="chartHeader">Vlhkost (%) – posledních 24 h</div>
          <HumidityChart data={series} />
        </div>
      </div>
    </div>
  );
}
