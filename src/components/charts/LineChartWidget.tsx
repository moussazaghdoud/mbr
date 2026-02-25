"use client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from "recharts";

interface LineChartWidgetProps {
  title: string;
  data: { period: string; value: number }[];
  target?: number;
  unit?: string;
  color?: string;
}

export default function LineChartWidget({
  title, data, target, unit = "", color = "#3b82f6",
}: LineChartWidgetProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit={unit} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8, color: "#fff" }}
            formatter={(v) => [`${v}${unit}`, "Value"]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={title}
          />
          {target !== undefined && (
            <ReferenceLine
              y={target}
              stroke="#ef4444"
              strokeDasharray="6 4"
              label={{ value: `Target ${target}${unit}`, fill: "#ef4444", fontSize: 11 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
