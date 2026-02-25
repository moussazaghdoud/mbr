"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import GaugeWidget from "@/components/widgets/GaugeWidget";
import BarChartWidget from "@/components/charts/BarChartWidget";
import { useKPIData } from "@/lib/use-kpi-data";

const TOP_IDS = ["srv-revenue", "cloud-arr", "ts-csat", "cloud-billed-users"];

export default function DashboardPage() {
  const { getKPI, costCenters, loaded } = useKPIData();

  if (!loaded) return <DashboardLayout title="Executive Dashboard"><div className="animate-pulse text-slate-400">Loading...</div></DashboardLayout>;

  const topKPIs = TOP_IDS.map((id) => getKPI(id)).filter(Boolean);

  const renewalRate = getKPI("comm-renewal-rate");
  const attachRate = getKPI("net-attach-rate");
  const csat = getKPI("ts-csat");

  const costData = costCenters.map((c) => ({
    period: c.name.length > 20 ? c.name.slice(0, 20) + "..." : c.name,
    value: Math.abs(c.value),
  }));

  return (
    <DashboardLayout title="Executive Dashboard">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topKPIs.map((k) => k && (
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

      {/* Gauge Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GaugeWidget
          label="Comm. Renewal Rate"
          value={Number(renewalRate?.value) || 79.9}
          target={Number(renewalRate?.target) || 85}
        />
        <GaugeWidget
          label="Network Attach Rate"
          value={Number(attachRate?.value) || 47.2}
          target={Number(attachRate?.target) || 50}
        />
        <GaugeWidget
          label="Customer Satisfaction"
          value={Number(csat?.value) || 94.1}
          target={Number(csat?.target) || 90}
        />
      </div>

      {/* Cost Breakdown */}
      <BarChartWidget
        title="Cost of Organization by Division (M\u20ac)"
        data={costData}
        series={[{ dataKey: "value", name: "Cost (M\u20ac)", color: "#ef4444" }]}
        unit=" M\u20ac"
      />
    </DashboardLayout>
  );
}
