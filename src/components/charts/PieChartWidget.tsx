"use client";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface PieChartWidgetProps {
  title: string;
  data: { name: string; value: number }[];
}

export default function PieChartWidget({ title, data }: PieChartWidgetProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            label={(props: PieLabelRenderProps) => `${props.name ?? ""} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8, color: "#fff" }}
          />
          <Legend />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold" fill="#64748b">
            {total.toLocaleString()}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
