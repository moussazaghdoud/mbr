"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import GaugeWidget from "@/components/widgets/GaugeWidget";
import BarChartWidget from "@/components/charts/BarChartWidget";
import { useKPIData } from "@/lib/use-kpi-data";
import { chartData } from "@/data/extracted-data";

const caseCBD = chartData.find((c) => c.id === "ts-case-cbd")!;
const caseNBD = chartData.find((c) => c.id === "ts-case-nbd")!;
const caseCCBD = chartData.find((c) => c.id === "ts-case-ccbd")!;
const caseInflowData = caseCBD.data.map((d, i) => ({
  period: d.period, CBD: d.value, NBD: caseNBD.data[i]?.value || 0, CCBD: caseCCBD.data[i]?.value || 0,
}));

const csatHigh = chartData.find((c) => c.id === "csat-score-high")!;
const csatMid = chartData.find((c) => c.id === "csat-score-mid")!;
const csatLow = chartData.find((c) => c.id === "csat-score-low")!;
const csatData = csatHigh.data.map((d, i) => ({
  period: d.period, "Satisfied (7|6)": d.value, "Neutral (5|4)": csatMid.data[i]?.value || 0, "Dissatisfied (3|2|1)": csatLow.data[i]?.value || 0,
}));

export default function SupportPage() {
  const { getKPI, loaded } = useKPIData();

  if (!loaded) return <DashboardLayout title="Technical Support"><div className="animate-pulse text-slate-400">Loading...</div></DashboardLayout>;

  const totalCases = getKPI("ts-case-inflow");
  const escalated = getKPI("ts-escalated");
  const latestCases = getKPI("ts-latest-cases");
  const avgMonth = getKPI("ts-avg-month");
  const csat = getKPI("ts-csat");
  const sloS2 = getKPI("ts-slo-s2-avg");
  const sloS3 = getKPI("ts-slo-s3-avg");
  const sloS4 = getKPI("ts-slo-s4-avg");

  return (
    <DashboardLayout title="Technical Support">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard name="Total Cases (Feb'25\u2013Jan'26)" value={totalCases?.value ?? 19798} />
        <KPICard name="Escalated Cases" value={escalated?.value ?? 1173} variance={`${(Number(escalated?.value ?? 1173) / Number(totalCases?.value ?? 19798) * 100).toFixed(1)}% rate`} />
        <KPICard name="Latest Month (Jan'26)" value={latestCases?.value ?? 1588} />
        <KPICard name="Average / Month" value={avgMonth?.value ?? 1650} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GaugeWidget label="CSAT" value={Number(csat?.value) || 94.1} target={Number(csat?.target) || 90} />
        <GaugeWidget label="SLO S2-High" value={Number(sloS2?.value) || 94.3} target={Number(sloS2?.target) || 85} />
        <GaugeWidget label="SLO S3-Medium" value={Number(sloS3?.value) || 94.2} target={Number(sloS3?.target) || 85} />
        <GaugeWidget label="SLO S4-Low" value={Number(sloS4?.value) || 98.8} target={Number(sloS4?.target) || 95} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">S2-HIGH</h4>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Avg: {getKPI("ts-slo-s2-avg")?.value}% / Latest: {getKPI("ts-slo-s2-latest")?.value}%</div>
          <p className="text-xs text-slate-400 mt-1">Target: 85% closed in 60 days max</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">S3-MEDIUM</h4>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Avg: {getKPI("ts-slo-s3-avg")?.value}% / Latest: {getKPI("ts-slo-s3-latest")?.value}%</div>
          <p className="text-xs text-slate-400 mt-1">Target: 85% closed in 120 days max</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">S4-LOW</h4>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Avg: {getKPI("ts-slo-s4-avg")?.value}% / Latest: {getKPI("ts-slo-s4-latest")?.value}%</div>
          <p className="text-xs text-slate-400 mt-1">Target: 95% closed in 240 days max</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BarChartWidget title="Case Inflow by Division" data={caseInflowData} series={[
          { dataKey: "CBD", name: "Communication BD", color: "#3b82f6", stackId: "cases" },
          { dataKey: "NBD", name: "Network BD", color: "#10b981", stackId: "cases" },
          { dataKey: "CCBD", name: "Cloud & Connected BD", color: "#f59e0b", stackId: "cases" },
        ]} />
        <BarChartWidget title="CSAT Score Distribution" data={csatData} series={[
          { dataKey: "Satisfied (7|6)", name: "Satisfied (7|6)", color: "#10b981", stackId: "csat" },
          { dataKey: "Neutral (5|4)", name: "Neutral (5|4)", color: "#f59e0b", stackId: "csat" },
          { dataKey: "Dissatisfied (3|2|1)", name: "Dissatisfied (3|2|1)", color: "#ef4444", stackId: "csat" },
        ]} />
      </div>
    </DashboardLayout>
  );
}
