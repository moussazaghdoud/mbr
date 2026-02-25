"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import GaugeWidget from "@/components/widgets/GaugeWidget";
import BarChartWidget from "@/components/charts/BarChartWidget";
import { kpis, chartData } from "@/data/extracted-data";

const supportKPIs = kpis.filter((k) => k.domain === "support");

// Build stacked case data
const caseCBD = chartData.find((c) => c.id === "ts-case-cbd")!;
const caseNBD = chartData.find((c) => c.id === "ts-case-nbd")!;
const caseCCBD = chartData.find((c) => c.id === "ts-case-ccbd")!;

const caseInflowData = caseCBD.data.map((d, i) => ({
  period: d.period,
  CBD: d.value,
  NBD: caseNBD.data[i]?.value || 0,
  CCBD: caseCCBD.data[i]?.value || 0,
}));

// CSAT scores stacked
const csatHigh = chartData.find((c) => c.id === "csat-score-high")!;
const csatMid = chartData.find((c) => c.id === "csat-score-mid")!;
const csatLow = chartData.find((c) => c.id === "csat-score-low")!;

const csatData = csatHigh.data.map((d, i) => ({
  period: d.period,
  "Satisfied (7|6)": d.value,
  "Neutral (5|4)": csatMid.data[i]?.value || 0,
  "Dissatisfied (3|2|1)": csatLow.data[i]?.value || 0,
}));

export default function SupportPage() {
  return (
    <DashboardLayout title="Technical Support">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard name="Total Cases (Feb'25–Jan'26)" value={19798} />
        <KPICard name="Escalated Cases" value={1173} unit="" variance={`${(1173/19798*100).toFixed(1)}% escalation rate`} />
        <KPICard name="Latest Month Cases (Jan'26)" value={1588} unit="" />
        <KPICard name="Average / Month" value={1650} />
      </div>

      {/* CSAT & SLO Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GaugeWidget label="CSAT" value={94.1} target={90} />
        <GaugeWidget label="SLO S2-High" value={94.3} target={85} />
        <GaugeWidget label="SLO S3-Medium" value={94.2} target={85} />
        <GaugeWidget label="SLO S4-Low" value={98.8} target={95} />
      </div>

      {/* SLO Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">S2-HIGH</h4>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Avg: 94.3% / Latest: 100%</div>
          <p className="text-xs text-slate-400 mt-1">Target: 85% closed in 60 days max</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">S3-MEDIUM</h4>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Avg: 94.2% / Latest: 93.3%</div>
          <p className="text-xs text-slate-400 mt-1">Target: 85% closed in 120 days max</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">S4-LOW</h4>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Avg: 98.8% / Latest: 98.2%</div>
          <p className="text-xs text-slate-400 mt-1">Target: 95% closed in 240 days max</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BarChartWidget
          title="Case Inflow by Division"
          data={caseInflowData}
          series={[
            { dataKey: "CBD", name: "Communication BD", color: "#3b82f6", stackId: "cases" },
            { dataKey: "NBD", name: "Network BD", color: "#10b981", stackId: "cases" },
            { dataKey: "CCBD", name: "Cloud & Connected BD", color: "#f59e0b", stackId: "cases" },
          ]}
        />
        <BarChartWidget
          title="CSAT Score Distribution"
          data={csatData}
          series={[
            { dataKey: "Satisfied (7|6)", name: "Satisfied (7|6)", color: "#10b981", stackId: "csat" },
            { dataKey: "Neutral (5|4)", name: "Neutral (5|4)", color: "#f59e0b", stackId: "csat" },
            { dataKey: "Dissatisfied (3|2|1)", name: "Dissatisfied (3|2|1)", color: "#ef4444", stackId: "csat" },
          ]}
        />
      </div>

      {/* CSAT Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard name="CSAT Latest" value="94.1%" unit="" target="90%" gap="+4.1pp" />
        <KPICard name="CSAT Average" value="94.9%" unit="" />
        <KPICard name="Total Surveys" value={3397} />
      </div>
    </DashboardLayout>
  );
}
