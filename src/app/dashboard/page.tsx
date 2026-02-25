"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import GaugeWidget from "@/components/widgets/GaugeWidget";
import BarChartWidget from "@/components/charts/BarChartWidget";
import { kpis, costCenters } from "@/data/extracted-data";

const topKPIs = [
  kpis.find((k) => k.id === "srv-revenue")!,
  kpis.find((k) => k.id === "cloud-arr")!,
  kpis.find((k) => k.id === "ts-csat")!,
  kpis.find((k) => k.id === "cloud-billed-users")!,
];

const costData = costCenters.map((c) => ({
  period: c.name.length > 20 ? c.name.slice(0, 20) + "..." : c.name,
  value: Math.abs(c.value),
  fullName: c.name,
}));

export default function DashboardPage() {
  return (
    <DashboardLayout title="Executive Dashboard">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topKPIs.map((k) => (
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
          value={79.9}
          target={85}
        />
        <GaugeWidget
          label="Network Attach Rate"
          value={47.2}
          target={50}
        />
        <GaugeWidget
          label="Customer Satisfaction"
          value={94.1}
          target={90}
        />
      </div>

      {/* Cost Breakdown */}
      <BarChartWidget
        title="Cost of Organization by Division (M€)"
        data={costData}
        series={[{ dataKey: "value", name: "Cost (M€)", color: "#ef4444" }]}
        unit=" M€"
      />
    </DashboardLayout>
  );
}
