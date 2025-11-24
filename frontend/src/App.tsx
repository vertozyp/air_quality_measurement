import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchNow,
  fetchSeries,
  type NowResp,
  type SeriesPoint,
  fetchThresholds,
  updateThresholds,
  type Thresholds,
} from "./common/api";
import NowCard from "./components/NowCard";
import CO2Chart from "./components/charts/CO2Chart";
import HumidityChart from "./components/charts/HumidityChart";
import SettingsFab from "./components/settings/SettingsFab";
import SettingsModal from "./components/settings/SettingsModal";
import useAlertAudio from "./hooks/useAlertAudio";

export default function App() {
  const [now, setNow] = useState<NowResp | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { unlockAudio, beep } = useAlertAudio();

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const thr = await fetchThresholds();
        if (alive) setThresholds(thr);
      } catch (e) {
        setErr(String(e));
      }
    })();
    const t = window.setInterval(async () => {
      try {
        const thr = await fetchThresholds();
        setThresholds(thr);
      } catch {
        /* ignore periodic */
      }
    }, 5 * 60_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const alertActive = useMemo(() => {
    if (!now || !thresholds) return false;
    return (
      now.co2_ppm >= thresholds.co2_ppm ||
      now.humidity_rh >= thresholds.humidity_pct
    );
  }, [now, thresholds]);

  const lastBeepedSampleRef = useRef<number | null>(null);
  useEffect(() => {
    if (!now || !thresholds) return;

    const over =
      now.co2_ppm >= thresholds.co2_ppm ||
      now.humidity_rh >= thresholds.humidity_pct;
    if (!over) return;

    const ts: number | null =
      now.ts ??
      now.ts_iso ??
      (typeof now.ts_iso === "string" ? Date.parse(now.ts_iso) : null);

    if (ts == null) {
      beep();
      return;
    }

    if (lastBeepedSampleRef.current !== ts) {
      beep();
      lastBeepedSampleRef.current = ts;
    }
  }, [now, thresholds, beep]);

  async function handleSaveThresholds(t: Thresholds) {
    try {
      const saved = await updateThresholds(t);
      setThresholds(saved);
      setSettingsOpen(false);
    } catch (e) {
      setErr(String(e));
    }
  }

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

      {thresholds && now && alertActive && (
        <div
          className="card"
          style={{ background: "#fee", borderColor: "#f99", color: "#111" }}
        >
          Pozor: překročen limit kvality vzduchu.
        </div>
      )}

      <NowCard now={now} />

      <div className="grow charts">
        <div className="card chartCard">
          <div className="chartHeader">CO₂ (ppm) – posledních 24 h</div>
          <CO2Chart data={series} threshold={thresholds?.co2_ppm} />
        </div>

        <div className="card chartCard">
          <div className="chartHeader">Vlhkost (%) – posledních 24 h</div>
          <HumidityChart data={series} threshold={thresholds?.humidity_pct} />
        </div>
      </div>

      <SettingsFab
        onClick={() => {
          unlockAudio();
          setSettingsOpen(true);
        }}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        thresholds={thresholds}
        onChange={handleSaveThresholds}
      />
    </div>
  );
}
