"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Play, Upload,
  Settings, FileSpreadsheet, Activity, List, Plug, Save, Loader2,
} from "lucide-react";

interface SyncConfig {
  siteUrl: string;
  driveId: string;
  folderPath: string;
  filePattern: string;
  pollingIntervalMin: number;
  enabled: boolean;
  connectionStatus: string;
  lastTestedAt: string | null;
  username: string;
  password: string;
  hasPassword: boolean;
}

interface FileLog {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  rowsFound: number;
  rowsImported: number;
  rowsRejected: number;
  errorMessage: string | null;
  processingMs: number;
}

interface SyncJob {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalFiles: number;
  filesProcessed: number;
  filesFailed: number;
  rowsImported: number;
  rowsUpdated: number;
  rowsRejected: number;
  errorMessage: string | null;
  triggeredBy: string;
  fileLogs: FileLog[];
}

interface SPFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: string;
  lastSyncedAt: string | null;
  hasChanged: boolean;
}

type Tab = "overview" | "config" | "files" | "logs" | "mappings";

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "config", label: "Configuration", icon: Settings },
  { id: "files", label: "Files", icon: FileSpreadsheet },
  { id: "logs", label: "Sync Logs", icon: List },
  { id: "mappings", label: "Mappings", icon: Plug },
];

export default function SharePointSyncPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [status, setStatus] = useState<{
    lastJob: SyncJob | null;
    lastSuccessfulSync: string | null;
    totalJobs: number;
    totalSyncedKPIs: number;
    schedulerRunning: boolean;
  } | null>(null);
  const [files, setFiles] = useState<SPFile[]>([]);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [mappings, setMappings] = useState<{ id: string; excelColumn: string; kpiId: string; kpiField: string; transform: string; required: boolean }[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<{ name: string; size: number; status: "pending" | "uploading" | "done" | "error"; detail?: string }[]>([]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    if (type === "success") setTimeout(() => setMessage(null), 15000);
    // errors stay until manually dismissed
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sharepoint-sync/status");
      const data = await res.json();
      if (data.config) setConfig(data.config);
      setStatus(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const fetchConfig = async () => {
    const res = await fetch("/api/admin/sharepoint-sync/config");
    const data = await res.json();
    if (!data.error) setConfig(data);
  };

  const saveConfig = async () => {
    if (!config) return;
    setLoading((l) => ({ ...l, config: true }));
    try {
      const res = await fetch("/api/admin/sharepoint-sync/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfig(data);
      showMsg("success", "Configuration saved");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading((l) => ({ ...l, config: false }));
    }
  };

  const testConnection = async () => {
    setLoading((l) => ({ ...l, test: true }));
    try {
      const res = await fetch("/api/admin/sharepoint-sync/test-connection", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showMsg("success", `Connected: ${data.message}`);
        fetchConfig();
      } else {
        showMsg("error", `Connection failed: ${data.message}`);
      }
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Test failed");
    } finally {
      setLoading((l) => ({ ...l, test: false }));
    }
  };

  const fetchFiles = async () => {
    setLoading((l) => ({ ...l, files: true }));
    try {
      const res = await fetch("/api/admin/sharepoint-sync/files");
      const data = await res.json();
      if (data.files) setFiles(data.files);
      else showMsg("error", data.error || "Failed to list files");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading((l) => ({ ...l, files: false }));
    }
  };

  const runSync = async () => {
    setLoading((l) => ({ ...l, sync: true }));
    try {
      const res = await fetch("/api/admin/sharepoint-sync/sync", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        showMsg("error", data.error);
      } else {
        showMsg("success", `Sync completed: ${data.job?.rowsImported || 0} imported, ${data.job?.rowsUpdated || 0} updated`);
        fetchStatus();
        fetchLogs();
      }
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading((l) => ({ ...l, sync: false }));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Show file list immediately
    const fileEntries = Array.from(fileList).map((f) => ({
      name: f.name,
      size: f.size,
      status: "uploading" as const,
    }));
    setUploadFiles(fileEntries);
    setLoading((l) => ({ ...l, upload: true }));

    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append("files", fileList[i]);
      }
      const res = await fetch("/api/admin/sharepoint-sync/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const job = data.job;

      // Update file entries with results from fileLogs
      if (job?.fileLogs) {
        setUploadFiles(job.fileLogs.map((fl: FileLog) => ({
          name: fl.fileName,
          size: fl.fileSize,
          status: fl.status === "completed" ? "done" as const : "error" as const,
          detail: fl.status === "completed"
            ? `${fl.rowsImported} rows imported`
            : fl.errorMessage || "Failed",
        })));
      } else {
        setUploadFiles((prev) => prev.map((f) => ({ ...f, status: "done" as const })));
      }

      if (job) {
        showMsg("success", `Upload sync completed: ${job.rowsImported ?? 0} imported, ${job.rowsUpdated ?? 0} updated, ${job.rowsRejected ?? 0} rejected`);
      } else {
        showMsg("success", "Upload completed");
      }
      fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadFiles((prev) => prev.map((f) => ({ ...f, status: "error" as const, detail: msg })));
      showMsg("error", msg);
    } finally {
      setLoading((l) => ({ ...l, upload: false }));
      e.target.value = "";
    }
  };

  const fetchLogs = async () => {
    setLoading((l) => ({ ...l, logs: true }));
    try {
      const res = await fetch("/api/admin/sharepoint-sync/logs?limit=20");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch { /* ignore */ }
    setLoading((l) => ({ ...l, logs: false }));
  };

  const fetchMappings = async () => {
    const res = await fetch("/api/admin/sharepoint-sync/mappings");
    const data = await res.json();
    if (data.mappings) setMappings(data.mappings);
  };

  useEffect(() => {
    if (tab === "files") fetchFiles();
    if (tab === "logs") fetchLogs();
    if (tab === "mappings") fetchMappings();
    if (tab === "config") fetchConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <DashboardLayout title="SharePoint Sync">
      {/* Message banner */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              title="Connection"
              value={config?.connectionStatus === "ok" ? "Connected" : config?.connectionStatus === "error" ? "Error" : "Not tested"}
              icon={config?.connectionStatus === "ok" ? CheckCircle : config?.connectionStatus === "error" ? XCircle : AlertTriangle}
              color={config?.connectionStatus === "ok" ? "emerald" : config?.connectionStatus === "error" ? "red" : "amber"}
            />
            <StatusCard
              title="Auto-Sync"
              value={config?.enabled ? `ON (${config.pollingIntervalMin}min)` : "OFF"}
              icon={config?.enabled ? RefreshCw : Clock}
              color={config?.enabled ? "blue" : "slate"}
            />
            <StatusCard
              title="Synced KPIs"
              value={String(status?.totalSyncedKPIs || 0)}
              icon={FileSpreadsheet}
              color="purple"
            />
            <StatusCard
              title="Total Syncs"
              value={String(status?.totalJobs || 0)}
              icon={Activity}
              color="indigo"
            />
          </div>

          {/* Last sync info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Last Sync</h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer">
                  {loading.upload ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Upload Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    multiple
                    onChange={handleUpload}
                    disabled={loading.upload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={runSync}
                  disabled={loading.sync}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading.sync ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Run Sync Now
                </button>
              </div>
            </div>

            {status?.lastJob ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Status" value={status.lastJob.status} badge />
                <InfoItem label="Started" value={new Date(status.lastJob.startedAt).toLocaleString()} />
                <InfoItem label="Files" value={`${status.lastJob.filesProcessed}/${status.lastJob.totalFiles}`} />
                <InfoItem label="Imported" value={String(status.lastJob.rowsImported)} />
                <InfoItem label="Updated" value={String(status.lastJob.rowsUpdated)} />
                <InfoItem label="Rejected" value={String(status.lastJob.rowsRejected)} />
                <InfoItem label="Failed Files" value={String(status.lastJob.filesFailed)} />
                <InfoItem label="Triggered By" value={status.lastJob.triggeredBy} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">No sync has been run yet.</p>
            )}

            {status?.lastSuccessfulSync && (
              <p className="mt-4 text-xs text-slate-400">
                Last successful sync: {new Date(status.lastSuccessfulSync).toLocaleString()}
              </p>
            )}
          </div>

          {/* Upload progress panel */}
          {uploadFiles.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload size={16} />
                  Upload Progress ({uploadFiles.length} file{uploadFiles.length > 1 ? "s" : ""})
                </h3>
                {!loading.upload && (
                  <button onClick={() => setUploadFiles([])}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                    <FileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatSize(f.size)}
                        {f.detail && <span className="ml-2">{f.detail}</span>}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {f.status === "uploading" && <Loader2 size={16} className="animate-spin text-blue-500" />}
                      {f.status === "done" && <CheckCircle size={16} className="text-emerald-500" />}
                      {f.status === "error" && <XCircle size={16} className="text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Configuration */}
      {tab === "config" && config && (
        <div className="space-y-6">
          {/* SharePoint Site Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">SharePoint Site</h3>
              <div className="flex gap-2">
                <button onClick={testConnection} disabled={loading.test}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50">
                  {loading.test ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                  Test Connection
                </button>
                <button onClick={saveConfig} disabled={loading.config}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {loading.config ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigField label="SharePoint Site URL" value={config.siteUrl}
                onChange={(v) => setConfig({ ...config, siteUrl: v })}
                placeholder="https://company.sharepoint.com/sites/MySite" />
              <ConfigField label="Drive ID (optional)" value={config.driveId}
                onChange={(v) => setConfig({ ...config, driveId: v })}
                placeholder="Leave empty for default document library" />
              <ConfigField label="Folder Path" value={config.folderPath}
                onChange={(v) => setConfig({ ...config, folderPath: v })}
                placeholder="/General/Reports" />
              <ConfigField label="File Pattern" value={config.filePattern}
                onChange={(v) => setConfig({ ...config, filePattern: v })}
                placeholder="*.xlsx" />
            </div>

            {config.lastTestedAt && (
              <p className="text-xs text-slate-400">
                Last tested: {new Date(config.lastTestedAt).toLocaleString()} — Status: {config.connectionStatus}
              </p>
            )}
          </div>

          {/* Credentials */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Login Credentials</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your SharePoint username and password. Encrypted (AES-256-GCM) before storage — never stored in plain text.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigField label="Username (email)" value={config.username || ""}
                onChange={(v) => setConfig({ ...config, username: v })}
                placeholder="your.email@company.com" />
              <ConfigFieldPassword label="Password" value={config.password || ""}
                onChange={(v) => setConfig({ ...config, password: v })}
                hasExisting={config.hasPassword} />
            </div>
          </div>

          {/* Auto-Sync Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Auto-Sync Settings</h3>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-300 peer-checked:bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Enable automatic sync</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">Interval (minutes):</label>
                <input type="number" min={5} max={1440} value={config.pollingIntervalMin}
                  onChange={(e) => setConfig({ ...config, pollingIntervalMin: parseInt(e.target.value) || 30 })}
                  className="w-20 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Files */}
      {tab === "files" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              SharePoint Files ({files.length})
            </h3>
            <button onClick={fetchFiles} disabled={loading.files}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
              {loading.files ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">File</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Modified</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Last Synced</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {files.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{f.name}</td>
                    <td className="px-4 py-3 text-slate-500">{formatSize(f.size)}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(f.lastModified).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{f.lastSyncedAt ? new Date(f.lastSyncedAt).toLocaleString() : "Never"}</td>
                    <td className="px-4 py-3">
                      {f.hasChanged ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Changed</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Up to date</span>
                      )}
                    </td>
                  </tr>
                ))}
                {files.length === 0 && !loading.files && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No files found. Check your configuration.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Logs */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sync History</h3>
            <button onClick={fetchLogs} disabled={loading.logs}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
              {loading.logs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {jobs.length === 0 && !loading.logs && (
            <p className="text-sm text-slate-400 text-center py-8">No sync jobs recorded yet.</p>
          )}
        </div>
      )}

      {/* TAB: Mappings */}
      {tab === "mappings" && (
        <MappingsPanel mappings={mappings} onRefresh={fetchMappings} showMsg={showMsg} />
      )}
    </DashboardLayout>
  );
}

/* ===== Sub-components ===== */

function StatusCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: typeof Activity; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
    slate: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color] || colors.slate}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} />
        <span className="text-xs font-medium uppercase tracking-wider opacity-75">{title}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function InfoItem({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  const statusColors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  };
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {badge ? (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[value] || statusColors.pending}`}>
          {value}
        </span>
      ) : (
        <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
      )}
    </div>
  );
}

function ConfigField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function ConfigFieldPassword({ label, value, onChange, hasExisting }: {
  label: string; value: string; onChange: (v: string) => void; hasExisting: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label}
        {hasExisting && !value && (
          <span className="ml-2 text-emerald-500 font-normal">(saved)</span>
        )}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hasExisting ? "Leave empty to keep current" : "Enter value"}
          className="w-full px-3 py-2.5 pr-16 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: SyncJob }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<string, string> = {
    completed: "border-l-emerald-500",
    failed: "border-l-red-500",
    partial: "border-l-amber-500",
    running: "border-l-blue-500",
    pending: "border-l-slate-400",
  };
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 ${statusColors[job.status] || ""} overflow-hidden`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30">
        <div className="flex items-center gap-4">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            job.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
            job.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
            job.status === "partial" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
          }`}>{job.status}</span>
          <span className="text-sm text-slate-900 dark:text-white">{new Date(job.startedAt).toLocaleString()}</span>
          <span className="text-xs text-slate-400">{job.triggeredBy}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{job.filesProcessed} files</span>
          <span>{job.rowsImported + job.rowsUpdated} rows</span>
          {job.rowsRejected > 0 && <span className="text-amber-500">{job.rowsRejected} rejected</span>}
        </div>
      </button>
      {expanded && job.fileLogs.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1">File</th>
                <th className="text-left py-1">Status</th>
                <th className="text-right py-1">Rows</th>
                <th className="text-right py-1">Time</th>
                <th className="text-left py-1">Error</th>
              </tr>
            </thead>
            <tbody>
              {job.fileLogs.map((fl) => (
                <tr key={fl.id} className="border-t border-slate-100 dark:border-slate-700/50">
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">{fl.fileName}</td>
                  <td className="py-1.5">
                    <span className={`px-1.5 py-0.5 rounded ${
                      fl.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      fl.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      fl.status === "skipped" ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" :
                      "bg-blue-100 text-blue-700"
                    }`}>{fl.status}</span>
                  </td>
                  <td className="py-1.5 text-right text-slate-500">{fl.rowsImported}/{fl.rowsFound}</td>
                  <td className="py-1.5 text-right text-slate-500">{fl.processingMs}ms</td>
                  <td className="py-1.5 text-red-400 truncate max-w-[200px]">{fl.errorMessage || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {job.errorMessage && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-red-50 dark:bg-red-900/10">
          <p className="text-xs text-red-600 dark:text-red-400">{job.errorMessage}</p>
        </div>
      )}
    </div>
  );
}

function MappingsPanel({ mappings, onRefresh, showMsg }: {
  mappings: { id: string; excelColumn: string; kpiId: string; kpiField: string; transform: string; required: boolean }[];
  onRefresh: () => void;
  showMsg: (type: "success" | "error", text: string) => void;
}) {
  const [rows, setRows] = useState(mappings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRows(mappings), [mappings]);

  const addRow = () => {
    setRows([...rows, { id: `new-${Date.now()}`, excelColumn: "", kpiId: "", kpiField: "value", transform: "auto", required: false }]);
  };

  const updateRow = (idx: number, field: string, value: unknown) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], [field]: value };
    setRows(updated);
  };

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const saveMappings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sharepoint-sync/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-save", mappings: rows }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showMsg("success", `Saved ${data.count} mappings`);
      onRefresh();
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Column Mappings</h3>
          <p className="text-xs text-slate-400 mt-1">
            Map Excel column headers to dashboard KPI fields. Leave empty for auto-detection.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={addRow}
            className="px-3 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            + Add Mapping
          </button>
          <button onClick={saveMappings} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No mappings configured. The system will use auto-detection mode.<br />
          Auto-detection looks for columns named: id, name, value, target, variance, period, unit, domain.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Excel Column</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">KPI ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Field</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Transform</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Required</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    <input type="text" value={row.excelColumn} onChange={(e) => updateRow(idx, "excelColumn", e.target.value)}
                      placeholder="e.g. Revenue" className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={row.kpiId} onChange={(e) => updateRow(idx, "kpiId", e.target.value)}
                      placeholder="e.g. srv-revenue" className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={row.kpiField} onChange={(e) => updateRow(idx, "kpiField", e.target.value)}
                      className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none">
                      <option value="value">value</option>
                      <option value="target">target</option>
                      <option value="variance">variance</option>
                      <option value="period">period</option>
                      <option value="name">name</option>
                      <option value="unit">unit</option>
                      <option value="gap">gap</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={row.transform} onChange={(e) => updateRow(idx, "transform", e.target.value)}
                      className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none">
                      <option value="auto">auto</option>
                      <option value="none">none</option>
                      <option value="number">number</option>
                      <option value="percentage">percentage</option>
                      <option value="currency">currency</option>
                      <option value="date">date</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.required} onChange={(e) => updateRow(idx, "required", e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300" />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                      <XCircle size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
