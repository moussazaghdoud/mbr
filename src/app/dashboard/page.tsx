"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import {
  FileSpreadsheet, RefreshCw, Loader2, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";

interface SheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

interface FileData {
  fileName: string;
  sheets: SheetData[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function DashboardPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sharepoint-sync/sheets");
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleSection = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const cleanFileName = (name: string) =>
    name.replace(/\.(xlsx|xls)$/i, "").replace(/^Slide\s*\d+[_\s]*/i, "").replace(/_/g, " ").trim();

  if (loading) {
    return (
      <DashboardLayout title="Executive Dashboard">
        <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
          <Loader2 size={20} className="animate-spin" /> Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (files.length === 0) {
    return (
      <DashboardLayout title="Executive Dashboard">
        <div className="text-center py-20">
          <FileSpreadsheet size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No data uploaded yet</h2>
          <p className="text-sm text-slate-400">
            Go to <a href="/admin/sharepoint-sync" className="text-blue-600 hover:underline">SP Sync</a> and upload your Excel files.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Executive Dashboard">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">{files.length} section{files.length > 1 ? "s" : ""}</p>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="space-y-8">
        {files.map((file) => {
          const sectionName = cleanFileName(file.fileName);
          const isCollapsed = collapsed.has(file.fileName);
          return (
            <section key={file.fileName}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(file.fileName)}
                className="w-full flex items-center gap-3 mb-4 group"
              >
                {isCollapsed ? <ChevronRight size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {sectionName}
                </h2>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 ml-2" />
              </button>

              {!isCollapsed && (
                <div className="space-y-6">
                  {file.sheets.map((sheet, si) => (
                    <SheetSection key={si} sheet={sheet} showTitle={file.sheets.length > 1} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

/* ===== Sheet Section — auto-detects visualization ===== */
function SheetSection({ sheet, showTitle }: { sheet: SheetData; showTitle: boolean }) {
  const { headers, rows } = sheet;

  // Classify columns
  const labelCols: string[] = [];
  const numCols: string[] = [];

  for (const h of headers) {
    if (h === "__rowNumber") continue;
    const numCount = rows.filter((r) => typeof r[h] === "number").length;
    if (numCount > rows.length * 0.5) {
      numCols.push(h);
    } else {
      labelCols.push(h);
    }
  }

  const primaryLabel = labelCols[0] || headers[0];
  const hasEnoughRows = rows.length >= 3;
  const hasNumericData = numCols.length > 0;

  // Determine visualization type
  const isKPISummary = rows.length <= 6 && numCols.length >= 1 && numCols.length <= 3;
  const isTimeSeries = hasEnoughRows && hasNumericData && rows.length >= 5;
  const isComparison = hasEnoughRows && hasNumericData && numCols.length >= 2;

  return (
    <div>
      {showTitle && (
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{sheet.sheetName}</h3>
      )}

      {/* KPI Cards — show for summary-style data */}
      {isKPISummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {rows.map((row, ri) => {
            const label = String(row[primaryLabel] || `Item ${ri + 1}`);
            const mainValue = numCols[0] ? row[numCols[0]] : null;
            const secondValue = numCols[1] ? row[numCols[1]] : null;
            return (
              <KPICardAuto
                key={ri}
                label={label}
                value={mainValue}
                secondLabel={numCols[1]}
                secondValue={secondValue}
              />
            );
          })}
        </div>
      )}

      {/* Chart — bar or line */}
      {hasNumericData && hasEnoughRows && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-4">
          {isTimeSeries && numCols.length <= 3 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows.map((r) => ({ label: String(r[primaryLabel] || ""), ...pickNumeric(r, numCols) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {numCols.map((col, i) => (
                  <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : isComparison ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rows.map((r) => ({ label: String(r[primaryLabel] || ""), ...pickNumeric(r, numCols) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {numCols.map((col, i) => (
                  <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rows.map((r) => ({ label: String(r[primaryLabel] || ""), value: Number(r[numCols[0]]) || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Pie chart for small datasets with 1 numeric column */}
      {rows.length >= 2 && rows.length <= 10 && numCols.length === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={rows.map((r) => ({ name: String(r[primaryLabel] || ""), value: Math.abs(Number(r[numCols[0]]) || 0) }))}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                paddingAngle={2} dataKey="value"
                label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data table — always shown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {headers.filter((h) => h !== "__rowNumber").map((h, i) => (
                  <th key={i} className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                    numCols.includes(h) ? "text-right" : "text-left"
                  }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                  {headers.filter((h) => h !== "__rowNumber").map((h, hi) => {
                    const val = row[h];
                    const isNum = typeof val === "number";
                    return (
                      <td key={hi} className={`px-4 py-2 whitespace-nowrap ${
                        isNum ? "text-right font-medium text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                      }`}>
                        {val === null || val === undefined ? "" : isNum ? fmtNum(val) : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== Auto KPI Card ===== */
function KPICardAuto({ label, value, secondLabel, secondValue }: {
  label: string; value: unknown; secondLabel?: string; secondValue?: unknown;
}) {
  const numVal = typeof value === "number" ? value : parseFloat(String(value));
  const isPositive = !isNaN(numVal) && numVal > 0;
  const isNegative = !isNaN(numVal) && numVal < 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider truncate">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === "number" ? fmtNum(value) : String(value ?? "—")}
        </p>
        {!isNaN(numVal) && (
          <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${
            isPositive ? "text-emerald-600" : isNegative ? "text-red-500" : "text-slate-400"
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
          </span>
        )}
      </div>
      {secondLabel && secondValue !== null && secondValue !== undefined && (
        <p className="text-xs text-slate-400 mt-1">
          {secondLabel}: <span className="font-medium text-slate-600 dark:text-slate-300">
            {typeof secondValue === "number" ? fmtNum(secondValue) : String(secondValue)}
          </span>
        </p>
      )}
    </div>
  );
}

function pickNumeric(row: Record<string, unknown>, cols: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const col of cols) {
    result[col] = Number(row[col]) || 0;
  }
  return result;
}

function fmtNum(val: number): string {
  if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + "K";
  if (Number.isInteger(val)) return val.toLocaleString();
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
