import React from "react";
import type { Thresholds } from "../../common/api";

type Props = {
  thresholds: Thresholds | null;
  onChange: (t: Thresholds) => void;
};

export default function SettingsCard({ thresholds, onChange }: Props) {
  const [draft, setDraft] = React.useState<Thresholds>({
    co2_ppm: 1000,
    humidity_pct: 60,
  });

  React.useEffect(() => {
    if (thresholds) setDraft(thresholds);
  }, [thresholds]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onChange(draft);
  }

  return (
    <div className="card">
      <h3 style={{ margin: 0, marginBottom: 12 }}>Nastavení limitů</h3>

      {!thresholds ? (
        <div>Načítám…</div>
      ) : (
        <form onSubmit={submit} className="settingsGrid">
          <label>
            CO₂ limit (ppm)
            <input
              type="number"
              min={300}
              max={5000}
              step={50}
              value={draft.co2_ppm}
              onChange={(e) =>
                setDraft({ ...draft, co2_ppm: Number(e.target.value) })
              }
            />
          </label>

          <label>
            Vlhkost limit (%)
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={draft.humidity_pct}
              onChange={(e) =>
                setDraft({ ...draft, humidity_pct: Number(e.target.value) })
              }
            />
          </label>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button type="submit">Uložit</button>
          </div>
        </form>
      )}
    </div>
  );
}
