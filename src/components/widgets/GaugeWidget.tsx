"use client";

interface GaugeWidgetProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
}

export default function GaugeWidget({ value, target, label, unit = "%" }: GaugeWidgetProps) {
  const pct = Math.min((value / target) * 100, 120);
  const angle = (pct / 120) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const r = 70;
  const cx = 90, cy = 85;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  const largeArc = angle > 90 ? 1 : 0;

  const color = value >= target ? "#10b981" : value >= target * 0.95 ? "#f59e0b" : "#ef4444";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path
          d="M 20 85 A 70 70 0 0 1 160 85"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M 20 85 A 70 70 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <text x="90" y="75" textAnchor="middle" className="text-2xl font-bold" fill={color} fontSize="24">
          {value}{unit}
        </text>
        <text x="90" y="100" textAnchor="middle" fill="#94a3b8" fontSize="12">
          Target: {target}{unit}
        </text>
      </svg>
      <span
        className={`text-xs font-medium mt-1 ${
          value >= target ? "text-emerald-600" : "text-red-500"
        }`}
      >
        Gap: {value >= target ? "+" : ""}{(value - target).toFixed(1)}pp
      </span>
    </div>
  );
}
