"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import DataTable from "@/components/widgets/DataTable";
import BarChartWidget from "@/components/charts/BarChartWidget";
import { useKPIData } from "@/lib/use-kpi-data";
import { useState } from "react";

const forecastData = [
  { category: "Network Services", target: 7.75, qtd: 2.4, forecast: 7.56, pct: "97.6%" },
  { category: "Communication Services", target: 21.7, qtd: 6.3, forecast: 20.8, pct: "95.8%" },
  { category: "Total Services", target: 29.4, qtd: 8.7, forecast: 28.3, pct: "96.3%" },
  { category: "Cloud", target: 7.4, qtd: 1.9, forecast: 7.1, pct: "95.9%" },
  { category: "Cost of Organization", target: 6.9, qtd: 1.9, forecast: 6.6, pct: "94.8%" },
  { category: "Tax Credit & Funding", target: 0.43, qtd: 0.0, forecast: 0.43, pct: "100%" },
];

const columns = [
  { key: "category", label: "Category" },
  { key: "target", label: "Q1'26 Target (M\u20ac)", editable: true },
  { key: "qtd", label: "QTD (M\u20ac)", editable: true },
  { key: "forecast", label: "Forecast (M\u20ac)", editable: true },
  { key: "pct", label: "% Achievement" },
];

export default function FinancialPage() {
  const { getByDomain, costCenters, loaded } = useKPIData();
  const [data, setData] = useState(forecastData);

  if (!loaded) return <DashboardLayout title="Financial Overview"><div className="animate-pulse text-slate-400">Loading...</div></DashboardLayout>;

  const revenueKPIs = getByDomain("financial").filter((k) => !k.id.includes("q1"));

  const handleEdit = (row: number, key: string, value: string) => {
    const updated = [...data];
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      (updated[row] as Record<string, unknown>)[key] = numVal;
      updated[row].pct = ((updated[row].forecast / updated[row].target) * 100).toFixed(1) + "%";
    }
    setData(updated);
  };

  const costData = costCenters.map((c) => ({
    period: c.name.split("(")[0].trim(),
    cost: Math.abs(c.value),
  }));

  return (
    <DashboardLayout title="Financial Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {revenueKPIs.slice(0, 4).map((k) => (
          <KPICard key={k.id} name={k.name} value={k.value} unit={k.unit} variance={k.variance} varianceDirection={k.varianceDirection} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {revenueKPIs.slice(4).map((k) => (
          <KPICard key={k.id} name={k.name} value={k.value} unit={k.unit} variance={k.variance} varianceDirection={k.varianceDirection} />
        ))}
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Q1&apos;26 Revenue Forecast vs Target</h3>
        <DataTable columns={columns} data={data} onCellEdit={handleEdit} />
      </div>
      <BarChartWidget title="Cost of Organization by Division (M\u20ac)" data={costData} series={[{ dataKey: "cost", name: "Cost (M\u20ac)", color: "#ef4444" }]} unit=" M\u20ac" />
    </DashboardLayout>
  );
}
