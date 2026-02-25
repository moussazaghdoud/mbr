"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import BarChartWidget from "@/components/charts/BarChartWidget";
import LineChartWidget from "@/components/charts/LineChartWidget";
import { kpis, chartData } from "@/data/extracted-data";

const cloudKPIs = kpis.filter((k) => k.domain === "cloud");
const mrrTrend = chartData.find((c) => c.id === "cloud-mrr-trend")!;
const usersTrend = chartData.find((c) => c.id === "cloud-users-trend")!;
const arpuTrend = chartData.find((c) => c.id === "cloud-arpu-trend")!;

const mrrBarData = mrrTrend.data.map((d) => ({
  period: d.period,
  MRR: Math.round(d.value / 1000),
}));

const usersBarData = usersTrend.data.map((d) => ({
  period: d.period,
  Users: Math.round(d.value / 1000),
}));

export default function CloudPage() {
  return (
    <DashboardLayout title="Cloud Business">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cloudKPIs.map((k) => (
          <KPICard
            key={k.id}
            name={k.name}
            value={k.value}
            unit={k.unit}
            variance={k.variance}
            varianceDirection={k.varianceDirection}
          />
        ))}
      </div>

      {/* MRR & Users Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BarChartWidget
          title="Monthly Recurring Revenue (K€)"
          data={mrrBarData}
          series={[{ dataKey: "MRR", name: "MRR (K€)", color: "#3b82f6" }]}
          unit=" K€"
        />
        <BarChartWidget
          title="Billed Users (Thousands)"
          data={usersBarData}
          series={[{ dataKey: "Users", name: "Users (K)", color: "#10b981" }]}
          unit="K"
        />
      </div>

      {/* ARPU Trend */}
      <LineChartWidget
        title="Average Revenue Per User (ARPU) — €"
        data={arpuTrend.data}
        unit="€"
        color="#8b5cf6"
      />

      {/* Cloud Growth Summary */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Cloud Growth Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">MRR Growth (Jan&apos;25 to Jan&apos;26):</span>
            <span className="font-semibold text-emerald-600 ml-2">+18.4%</span>
          </div>
          <div>
            <span className="text-slate-500">User Growth:</span>
            <span className="font-semibold text-emerald-600 ml-2">+23%</span>
          </div>
          <div>
            <span className="text-slate-500">ARPU Trend:</span>
            <span className="font-semibold text-amber-500 ml-2">-3.7% (declining)</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
