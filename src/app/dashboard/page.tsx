"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from "react";
import { FileSpreadsheet, RefreshCw, Loader2, ChevronDown, ChevronRight } from "lucide-react";

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

export default function DashboardPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sharepoint-sync/sheets");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
        // Auto-expand all files
        setExpandedFiles(new Set(data.files.map((f: FileData) => f.fileName)));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFile = (fileName: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  };

  // Clean up file name for display: remove extension, "Slide X_" prefix, underscores
  const cleanFileName = (name: string) => {
    return name
      .replace(/\.(xlsx|xls)$/i, "")
      .replace(/^Slide\s*\d+[_\s]*/i, "")
      .replace(/_/g, " ")
      .trim();
  };

  if (loading) {
    return (
      <DashboardLayout title="Executive Dashboard">
        <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
          <Loader2 size={20} className="animate-spin" />
          Loading dashboard data...
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
          <p className="text-sm text-slate-400 mb-4">
            Go to <a href="/admin/sharepoint-sync" className="text-blue-600 hover:underline">SP Sync</a> and upload your Excel files to populate the dashboard.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Executive Dashboard">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">{files.length} file{files.length > 1 ? "s" : ""} loaded</p>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {files.map((file) => (
          <div key={file.fileName}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* File header */}
            <button
              onClick={() => toggleFile(file.fileName)}
              className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              {expandedFiles.has(file.fileName) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <FileSpreadsheet size={18} className="text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex-1">
                {cleanFileName(file.fileName)}
              </h2>
              <span className="text-xs text-slate-400">
                {file.sheets.length} sheet{file.sheets.length > 1 ? "s" : ""} &middot;{" "}
                {file.sheets.reduce((sum, s) => sum + s.rowCount, 0)} rows
              </span>
            </button>

            {/* Sheets */}
            {expandedFiles.has(file.fileName) && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                {file.sheets.map((sheet, si) => (
                  <div key={si} className={si > 0 ? "border-t border-slate-100 dark:border-slate-700/50" : ""}>
                    {file.sheets.length > 1 && (
                      <div className="px-6 py-2 bg-slate-50 dark:bg-slate-700/20">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {sheet.sheetName}
                        </span>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50">
                            {sheet.headers.map((h, hi) => (
                              <th key={hi}
                                className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {sheet.rows.map((row, ri) => (
                            <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                              {sheet.headers.map((h, hi) => {
                                const val = row[h];
                                const isNum = typeof val === "number";
                                return (
                                  <td key={hi}
                                    className={`px-4 py-2 whitespace-nowrap ${
                                      isNum
                                        ? "text-right font-medium text-slate-900 dark:text-white"
                                        : "text-slate-600 dark:text-slate-300"
                                    }`}>
                                    {val === null || val === undefined
                                      ? ""
                                      : isNum
                                        ? formatNumber(val)
                                        : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

function formatNumber(val: number): string {
  if (Number.isInteger(val) && Math.abs(val) < 1e12) return val.toLocaleString();
  if (Math.abs(val) >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (Math.abs(val) < 0.01) return val.toFixed(4);
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
