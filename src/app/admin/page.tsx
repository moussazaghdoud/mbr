"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataTable from "@/components/widgets/DataTable";
import { kpis } from "@/data/extracted-data";
import { useState, useEffect } from "react";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "KPI Name" },
  { key: "domain", label: "Domain" },
  { key: "value", label: "Value", editable: true },
  { key: "unit", label: "Unit" },
  { key: "period", label: "Period" },
  { key: "target", label: "Target", editable: true },
  { key: "variance", label: "Variance" },
];

export default function AdminPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ces-kpi-data");
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      setData(kpis.map((k) => ({ ...k })));
    }
  }, []);

  const handleEdit = (row: number, key: string, value: string) => {
    const updated = [...data];
    const numVal = parseFloat(value);
    updated[row] = { ...updated[row], [key]: isNaN(numVal) ? value : numVal };
    setData(updated);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("ces-kpi-data", JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem("ces-kpi-data");
    setData(kpis.map((k) => ({ ...k })));
    setSaved(false);
  };

  return (
    <DashboardLayout title="Admin — Data Management">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.length} KPIs loaded. Click any editable cell to modify values.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              saved ? "bg-emerald-500" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Filter by domain */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "financial", "orders", "services", "support", "cloud", "training"].map((d) => (
          <button
            key={d}
            onClick={() => {
              if (d === "all") {
                const stored = localStorage.getItem("ces-kpi-data");
                setData(stored ? JSON.parse(stored) : kpis.map((k) => ({ ...k })));
              } else {
                const source = localStorage.getItem("ces-kpi-data");
                const all = source ? JSON.parse(source) : kpis.map((k) => ({ ...k }));
                setData(all.filter((k: Record<string, unknown>) => k.domain === d));
              }
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors capitalize"
          >
            {d}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={data} onCellEdit={handleEdit} />

      {/* Audit Info */}
      <div className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Changes are stored in browser localStorage. Last modified values will persist across sessions.
        Use &quot;Reset to Default&quot; to restore original PPTX-extracted data.
      </div>
    </DashboardLayout>
  );
}
