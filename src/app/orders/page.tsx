"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import BarChartWidget from "@/components/charts/BarChartWidget";
import { useKPIData } from "@/lib/use-kpi-data";

const yoyData = [
  { period: "Services", q125: 25.9, q126: 17.8 },
  { period: "Cloud Solutions", q125: 3.0, q126: 2.6 },
  { period: "Network", q125: 6.2, q126: 2.3 },
  { period: "Communication", q125: 19.7, q126: 15.5 },
];

export default function OrdersPage() {
  const { getByDomain, loaded } = useKPIData();

  if (!loaded) return <DashboardLayout title="Orders Intake"><div className="animate-pulse text-slate-400">Loading...</div></DashboardLayout>;

  const orderKPIs = getByDomain("orders");

  return (
    <DashboardLayout title="Orders Intake">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {orderKPIs.map((k) => (
          <KPICard key={k.id} name={k.name} value={k.value} unit={k.unit} variance={k.variance} varianceDirection={k.varianceDirection} />
        ))}
      </div>
      <BarChartWidget title="Q1 Orders \u2014 YoY Comparison (M\u20ac)" data={yoyData} series={[
        { dataKey: "q125", name: "Q1'25", color: "#94a3b8" },
        { dataKey: "q126", name: "Q1'26 QTD", color: "#3b82f6" },
      ]} unit=" M\u20ac" />
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Q1&apos;25 Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div><span className="font-medium">Services:</span> 25.9 M\u20ac</div>
          <div><span className="font-medium">Cloud:</span> 3.0 M\u20ac</div>
          <div><span className="font-medium">Network:</span> 6.2 M\u20ac</div>
          <div><span className="font-medium">Communication:</span> 19.7 M\u20ac</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
