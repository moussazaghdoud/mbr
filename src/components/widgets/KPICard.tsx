"use client";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  name: string;
  value: number | string;
  unit?: string;
  variance?: string;
  varianceDirection?: "up" | "down" | "flat";
  target?: number | string;
  gap?: string;
  onClick?: () => void;
}

export default function KPICard({
  name, value, unit, variance, varianceDirection, target, gap, onClick,
}: KPICardProps) {
  const varColor =
    varianceDirection === "up" ? "text-emerald-600" :
    varianceDirection === "down" ? "text-red-500" : "text-slate-500";

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {name}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        {variance && (
          <span className={`text-xs font-medium flex items-center gap-1 ${varColor}`}>
            {varianceDirection === "up" && <TrendingUp size={14} />}
            {varianceDirection === "down" && <TrendingDown size={14} />}
            {variance}
          </span>
        )}
        {target !== undefined && (
          <span className="text-xs text-slate-400">
            Target: {target}{unit === "%" ? "%" : unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>
      {gap && (
        <span className={`text-xs font-medium mt-1 inline-block ${
          gap.startsWith("+") ? "text-emerald-600" : "text-red-500"
        }`}>
          Gap: {gap}
        </span>
      )}
    </div>
  );
}
