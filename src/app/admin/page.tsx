"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataTable from "@/components/widgets/DataTable";
import { kpis } from "@/data/extracted-data";
import { useState, useEffect } from "react";
import { Plus, X, Pencil, Trash2, Copy, Download, Upload } from "lucide-react";

const DOMAINS = ["financial", "orders", "services", "support", "cloud", "training", "verticals"] as const;
const DIRECTIONS = ["up", "down", "flat"] as const;

interface KPIForm {
  id: string;
  name: string;
  domain: string;
  value: string;
  unit: string;
  period: string;
  target: string;
  targetUnit: string;
  variance: string;
  varianceDirection: string;
  gap: string;
  editable: boolean;
}

const emptyForm: KPIForm = {
  id: "", name: "", domain: "financial", value: "", unit: "M\u20ac",
  period: "Q1'26", target: "", targetUnit: "", variance: "",
  varianceDirection: "", gap: "", editable: true,
};

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "KPI Name", editable: true },
  { key: "domain", label: "Domain", editable: true },
  { key: "value", label: "Value", editable: true },
  { key: "unit", label: "Unit", editable: true },
  { key: "period", label: "Period", editable: true },
  { key: "target", label: "Target", editable: true },
  { key: "variance", label: "Variance", editable: true },
  { key: "varianceDirection", label: "Trend", editable: true },
  { key: "gap", label: "Gap", editable: true },
];

function getAllData(): Record<string, unknown>[] {
  if (typeof window === "undefined") return kpis.map((k) => ({ ...k }));
  const stored = localStorage.getItem("ces-kpi-data");
  return stored ? JSON.parse(stored) : kpis.map((k) => ({ ...k }));
}

export default function AdminPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [form, setForm] = useState<KPIForm>({ ...emptyForm });
  const [search, setSearch] = useState("");

  useEffect(() => {
    setData(getAllData());
  }, []);

  const applyFilter = (allData: Record<string, unknown>[], f: string, s: string) => {
    let result = allData;
    if (f !== "all") {
      result = result.filter((k) => k.domain === f);
    }
    if (s.trim()) {
      const q = s.toLowerCase();
      result = result.filter(
        (k) =>
          String(k.name ?? "").toLowerCase().includes(q) ||
          String(k.id ?? "").toLowerCase().includes(q) ||
          String(k.period ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  };

  const refreshView = (allData?: Record<string, unknown>[]) => {
    const all = allData ?? getAllData();
    setData(applyFilter(all, filter, search));
  };

  const handleFilterChange = (d: string) => {
    setFilter(d);
    setData(applyFilter(getAllData(), d, search));
  };

  const handleSearchChange = (s: string) => {
    setSearch(s);
    setData(applyFilter(getAllData(), filter, s));
  };

  const handleEdit = (row: number, key: string, value: string) => {
    // Update in filtered view
    const updated = [...data];
    const numVal = parseFloat(value);
    updated[row] = { ...updated[row], [key]: isNaN(numVal) ? value : numVal };
    setData(updated);

    // Also update in full store
    const all = getAllData();
    const rowId = updated[row].id;
    const idx = all.findIndex((k) => k.id === rowId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], [key]: isNaN(numVal) ? value : numVal };
      localStorage.setItem("ces-kpi-data", JSON.stringify(all));
    }
    setSaved(false);
  };

  const handleSave = () => {
    const all = getAllData();
    // Merge current filtered edits back
    for (const row of data) {
      const idx = all.findIndex((k) => k.id === row.id);
      if (idx >= 0) all[idx] = row;
    }
    localStorage.setItem("ces-kpi-data", JSON.stringify(all));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem("ces-kpi-data");
    setFilter("all");
    setSearch("");
    setData(kpis.map((k) => ({ ...k })));
    setSaved(false);
  };

  // --- Form handlers ---
  const openAddForm = () => {
    setForm({ ...emptyForm, id: `kpi-${Date.now()}` });
    setEditingKPI(null);
    setShowForm(true);
  };

  const openEditForm = (kpiId: string) => {
    const all = getAllData();
    const kpi = all.find((k) => k.id === kpiId);
    if (!kpi) return;
    setForm({
      id: String(kpi.id ?? ""),
      name: String(kpi.name ?? ""),
      domain: String(kpi.domain ?? "financial"),
      value: String(kpi.value ?? ""),
      unit: String(kpi.unit ?? ""),
      period: String(kpi.period ?? ""),
      target: String(kpi.target ?? ""),
      targetUnit: String(kpi.targetUnit ?? ""),
      variance: String(kpi.variance ?? ""),
      varianceDirection: String(kpi.varianceDirection ?? ""),
      gap: String(kpi.gap ?? ""),
      editable: kpi.editable !== false,
    });
    setEditingKPI(kpiId);
    setShowForm(true);
  };

  const handleFormChange = (field: keyof KPIForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = () => {
    if (!form.name.trim() || !form.id.trim()) return;

    const numValue = parseFloat(form.value);
    const numTarget = parseFloat(form.target);

    const kpiObj: Record<string, unknown> = {
      id: form.id.trim(),
      name: form.name.trim(),
      domain: form.domain,
      value: isNaN(numValue) ? form.value : numValue,
      unit: form.unit,
      period: form.period,
      target: form.target === "" ? undefined : isNaN(numTarget) ? form.target : numTarget,
      targetUnit: form.targetUnit || undefined,
      variance: form.variance || undefined,
      varianceDirection: form.varianceDirection || undefined,
      gap: form.gap || undefined,
      editable: form.editable,
    };

    const all = getAllData();

    if (editingKPI) {
      const idx = all.findIndex((k) => k.id === editingKPI);
      if (idx >= 0) {
        all[idx] = kpiObj;
      }
    } else {
      // Check duplicate ID
      if (all.some((k) => k.id === kpiObj.id)) {
        alert("A KPI with this ID already exists. Please use a unique ID.");
        return;
      }
      all.push(kpiObj);
    }

    localStorage.setItem("ces-kpi-data", JSON.stringify(all));
    refreshView(all);
    setShowForm(false);
    setEditingKPI(null);
    setSaved(false);
  };

  const handleDelete = (kpiId: string) => {
    if (!confirm(`Delete KPI "${kpiId}"? This cannot be undone.`)) return;
    const all = getAllData().filter((k) => k.id !== kpiId);
    localStorage.setItem("ces-kpi-data", JSON.stringify(all));
    refreshView(all);
    setSaved(false);
  };

  const handleDuplicate = (kpiId: string) => {
    const all = getAllData();
    const kpi = all.find((k) => k.id === kpiId);
    if (!kpi) return;
    const newKpi = { ...kpi, id: `${kpiId}-copy-${Date.now()}`, name: `${kpi.name} (copy)` };
    all.push(newKpi);
    localStorage.setItem("ces-kpi-data", JSON.stringify(all));
    refreshView(all);
    setSaved(false);
  };

  // --- Import / Export ---
  const handleExport = () => {
    const all = getAllData();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ces-kpi-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) {
            localStorage.setItem("ces-kpi-data", JSON.stringify(imported));
            setFilter("all");
            setSearch("");
            setData(imported);
            setSaved(false);
          } else {
            alert("Invalid JSON format. Expected an array of KPIs.");
          }
        } catch {
          alert("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <DashboardLayout title="Admin — Data Management">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.length} KPIs displayed ({getAllData().length} total). All fields are editable.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            <Upload size={14} /> Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download size={14} /> Export
          </button>
          <button onClick={handleReset} className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            Reset
          </button>
          <button onClick={handleSave} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${saved ? "bg-emerald-500" : "bg-blue-600 hover:bg-blue-700"}`}>
            {saved ? "Saved!" : "Save"}
          </button>
          <button onClick={openAddForm} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
            <Plus size={16} /> Add KPI
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search KPIs by name, ID, or period..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", ...DOMAINS].map((d) => (
            <button
              key={d}
              onClick={() => handleFilterChange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize ${
                filter === d
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table with action buttons */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800">
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
                #
              </th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, ri) => (
              <tr key={String(row.id)} className={`${ri % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"} hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors`}>
                <td className="px-3 py-2 text-slate-400 text-xs">{ri + 1}</td>
                {columns.map((col) => (
                  <InlineCell
                    key={col.key}
                    value={row[col.key]}
                    editable={col.editable}
                    onSave={(val) => handleEdit(ri, col.key, val)}
                  />
                ))}
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEditForm(String(row.id))} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDuplicate(String(row.id))} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 rounded" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDelete(String(row.id))} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            No KPIs found. Try a different filter or add a new KPI.
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500">
        All changes are persisted in browser localStorage. Use Export to download a JSON backup. Use Import to load data from a JSON file.
      </div>

      {/* ========================= */}
      {/* ADD / EDIT KPI MODAL FORM */}
      {/* ========================= */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingKPI ? "Edit KPI" : "Add New KPI"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5">
              {/* Row 1: ID + Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="ID (unique)" value={form.id} onChange={(v) => handleFormChange("id", v)} placeholder="e.g. cloud-arr-q2" disabled={!!editingKPI} />
                <FormField label="KPI Name" value={form.name} onChange={(v) => handleFormChange("name", v)} placeholder="e.g. Cloud ARR" required />
              </div>

              {/* Row 2: Domain + Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Domain</label>
                  <select
                    value={form.domain}
                    onChange={(e) => handleFormChange("domain", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d} className="capitalize">{d}</option>
                    ))}
                  </select>
                </div>
                <FormField label="Period" value={form.period} onChange={(v) => handleFormChange("period", v)} placeholder="e.g. Q1'26, Jan 2026, 2025" />
              </div>

              {/* Row 3: Value + Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Value" value={form.value} onChange={(v) => handleFormChange("value", v)} placeholder="e.g. 14.03" required />
                <FormField label="Unit" value={form.unit} onChange={(v) => handleFormChange("unit", v)} placeholder="e.g. M\u20ac, %, K\u20ac" />
                <FormField label="Target" value={form.target} onChange={(v) => handleFormChange("target", v)} placeholder="e.g. 85" />
              </div>

              {/* Row 4: Variance + Direction + Gap */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Variance" value={form.variance} onChange={(v) => handleFormChange("variance", v)} placeholder="e.g. +18.4% YoY" />
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Trend Direction</label>
                  <select
                    value={form.varianceDirection}
                    onChange={(e) => handleFormChange("varianceDirection", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- None --</option>
                    {DIRECTIONS.map((d) => (
                      <option key={d} value={d}>{d === "up" ? "Up (positive)" : d === "down" ? "Down (negative)" : "Flat"}</option>
                    ))}
                  </select>
                </div>
                <FormField label="Gap" value={form.gap} onChange={(v) => handleFormChange("gap", v)} placeholder="e.g. -5.1pp, +4.1pp" />
              </div>

              {/* Row 5: Editable toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.editable}
                    onChange={(e) => handleFormChange("editable", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-checked:bg-blue-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
                <span className="text-sm text-slate-600 dark:text-slate-400">Editable in back-office</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={!form.name.trim() || !form.id.trim()}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingKPI ? "Update KPI" : "Create KPI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ============================= */
/* Inline editable cell          */
/* ============================= */
function InlineCell({
  value,
  editable,
  onSave,
}: {
  value: unknown;
  editable?: boolean;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");

  const display = value === undefined || value === null ? "" : String(value);

  const start = () => {
    if (!editable) return;
    setEditVal(display);
    setEditing(true);
  };

  const commit = () => {
    onSave(editVal);
    setEditing(false);
  };

  return (
    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
      {editing ? (
        <input
          autoFocus
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          onBlur={commit}
          className="w-full px-2 py-1 border border-blue-500 rounded bg-white dark:bg-slate-700 text-sm outline-none"
        />
      ) : (
        <span
          onClick={start}
          className={editable ? "cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-600 px-2 py-1 rounded inline-block min-w-[2rem]" : ""}
        >
          {display || (editable ? <span className="text-slate-300">--</span> : "")}
        </span>
      )}
    </td>
  );
}

/* ============================= */
/* Reusable form field           */
/* ============================= */
function FormField({
  label, value, onChange, placeholder, required, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
