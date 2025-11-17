import type { SeriesPoint } from "../common/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function formatTime(tsIso: string) {
  const d = new Date(tsIso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SeriesChart({ data }: { data: SeriesPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="chartInner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Žádná data pro graf.
      </div>
    );
  }
  return (
    <div className="chartInner">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts_iso" tickFormatter={formatTime} minTickGap={32} />
          <YAxis
            yAxisId="co2"
            domain={[300, "dataMax+200"]}
            label={{ value: "ppm", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            labelFormatter={(v) => new Date(v as string).toLocaleString()}
            formatter={(val, name) => [
              Math.round(val as number),
              name === "co2_ppm" ? "CO₂ (ppm)" : name,
            ]}
          />
          <Line
            type="monotone"
            yAxisId="co2"
            dataKey="co2_ppm"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
