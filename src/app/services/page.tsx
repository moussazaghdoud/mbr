"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import GaugeWidget from "@/components/widgets/GaugeWidget";
import LineChartWidget from "@/components/charts/LineChartWidget";
import PieChartWidget from "@/components/charts/PieChartWidget";
import { kpis, chartData, servicesBreakdown } from "@/data/extracted-data";

const serviceKPIs = kpis.filter((k) => k.domain === "services");
const renewalChart = chartData.find((c) => c.id === "comm-renewal-rate-trend")!;
const attachChart = chartData.find((c) => c.id === "net-attach-rate-trend")!;

export default function ServicesPage() {
  return (
    <DashboardLayout title="Services">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {serviceKPIs.slice(0, 4).map((k) => (
          <KPICard
            key={k.id}
            name={k.name}
            value={k.value}
            unit={k.unit}
            variance={k.variance}
            varianceDirection={k.varianceDirection}
            target={k.target}
            gap={k.gap}
          />
        ))}
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GaugeWidget label="Renewal Rate" value={79.9} target={85} />
        <GaugeWidget label="Attach Rate" value={47.2} target={50} />
        <GaugeWidget label="ProServ CSAT" value={97.1} target={90} />
      </div>

      {/* Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LineChartWidget
          title="Communication Renewal Rate (%)"
          data={renewalChart.data}
          target={85}
          unit="%"
          color="#3b82f6"
        />
        <LineChartWidget
          title="Network Attach Rate (%)"
          data={attachChart.data}
          target={50}
          unit="%"
          color="#10b981"
        />
      </div>

      {/* Services Delivery Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PieChartWidget
          title="Breakdown by Solution"
          data={servicesBreakdown.bySolution.map((s) => ({ name: s.name, value: s.value }))}
        />
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Services Delivery — 2025 Breakdown
          </h3>
          <div className="space-y-4">
            {servicesBreakdown.byService.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{s.name}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{s.value} {s.unit}</span>
                  <span className="text-xs text-red-500 ml-2">{s.variance}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <KPICard name="2026 Target" value={14.5} unit="M€" />
          </div>
        </div>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serviceKPIs.slice(4).map((k) => (
          <KPICard
            key={k.id}
            name={k.name}
            value={typeof k.value === "number" ? k.value.toLocaleString() : k.value}
            unit={k.unit}
            variance={k.variance}
            varianceDirection={k.varianceDirection}
            target={k.target}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
