"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/widgets/KPICard";
import GaugeWidget from "@/components/widgets/GaugeWidget";
import PieChartWidget from "@/components/charts/PieChartWidget";
import { useKPIData } from "@/lib/use-kpi-data";

export default function TrainingPage() {
  const { getByDomain, getKPI, loaded } = useKPIData();

  if (!loaded) return <DashboardLayout title="Training Services"><div className="animate-pulse text-slate-400">Loading...</div></DashboardLayout>;

  const trainingKPIs = getByDomain("training");
  const trainingCsat = getKPI("training-csat");
  const surveyRate = getKPI("training-survey-rate");

  return (
    <DashboardLayout title="Training Services">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {trainingKPIs.map((k) => (
          <KPICard key={k.id} name={k.name} value={typeof k.value === "number" ? k.value.toLocaleString() : k.value} unit={k.unit} variance={k.variance} varianceDirection={k.varianceDirection} target={k.target} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GaugeWidget label="Training CSAT" value={Number(trainingCsat?.value) || 86.1} target={Number(trainingCsat?.target) || 80} />
        <GaugeWidget label="Survey Completion" value={Number(surveyRate?.value) || 60.1} target={100} />
        <PieChartWidget title="Survey Completion" data={[
          { name: "Completed", value: Number(surveyRate?.value) || 60.1 },
          { name: "Not Completed", value: 100 - (Number(surveyRate?.value) || 60.1) },
        ]} />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">2025 Training Operations Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Instructor Led Sessions</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{getKPI("training-sessions")?.value?.toLocaleString() ?? "450"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">People Trained</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{getKPI("training-people")?.value?.toLocaleString() ?? "1,828"}</p>
            <p className="text-xs text-red-500">-11% vs 2024</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Surveys Submitted</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{getKPI("training-surveys-submitted")?.value?.toLocaleString() ?? "8,281"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Active Certifications</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{getKPI("training-certifications")?.value?.toLocaleString() ?? "19,672"}</p>
            <p className="text-xs text-red-500">-3% vs Dec 2024</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
