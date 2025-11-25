import type { SeriesPoint } from "../../common/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

function formatTime(tsIso: string) {
  const d = new Date(tsIso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HumidityChart({
  data,
  threshold,
}: {
  data: SeriesPoint[];
  threshold?: number;
}) {
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
            yAxisId="%"
            domain={[0, 100]}
            label={{ value: "%", angle: -90, position: "insideLeft" }}
          />
          {typeof threshold === "number" && (
            <ReferenceLine
              y={threshold}
              yAxisId="%"
              label={{ value: `Limit ${threshold} %`, position: "top" }}
              stroke="red"
            />
          )}
          <Tooltip
            labelFormatter={(v) => new Date(v as string).toLocaleString()}
            formatter={(val) => [Math.round(val as number), "Rel. vlhkost (%)"]}
          />
          <Line
            yAxisId="%"
            type="monotone"
            dataKey="humidity_rh"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
