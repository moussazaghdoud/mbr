"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { roadmapStreams } from "@/data/roadmap-data";
import type { RoadmapStatus, RoadmapItem } from "@/data/roadmap-data";
import { useState } from "react";
import {
  CheckCircle2, Clock, CalendarClock, CircleDot,
  ChevronDown, ChevronRight, Filter,
} from "lucide-react";

const STATUS_CONFIG: Record<RoadmapStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800", icon: Clock },
  planned: { label: "Planned", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800", icon: CalendarClock },
  pipeline: { label: "Pipeline", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700", icon: CircleDot },
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-slate-300",
};

function getAllItems(): RoadmapItem[] {
  return roadmapStreams.flatMap((s) => s.items);
}

export default function RoadmapPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStream, setFilterStream] = useState<string>("all");
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(
    new Set(roadmapStreams.map((s) => s.id))
  );

  const allItems = getAllItems();
  const counts = {
    total: allItems.length,
    completed: allItems.filter((i) => i.status === "completed").length,
    "in-progress": allItems.filter((i) => i.status === "in-progress").length,
    planned: allItems.filter((i) => i.status === "planned").length,
    pipeline: allItems.filter((i) => i.status === "pipeline").length,
  };

  const completionPct = Math.round((counts.completed / counts.total) * 100);
  const activePct = Math.round(((counts.completed + counts["in-progress"]) / counts.total) * 100);

  const toggleStream = (id: string) => {
    setExpandedStreams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredStreams = roadmapStreams
    .filter((s) => filterStream === "all" || s.id === filterStream)
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => filterStatus === "all" || i.status === filterStatus),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <DashboardLayout title="2026 Solutions Roadmap">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <SummaryCard label="Total Items" value={counts.total} color="text-slate-700 dark:text-white" />
        <SummaryCard label="Completed" value={counts.completed} color="text-emerald-600" />
        <SummaryCard label="In Progress" value={counts["in-progress"]} color="text-blue-600" />
        <SummaryCard label="Planned" value={counts.planned} color="text-amber-600" />
        <SummaryCard label="Pipeline" value={counts.pipeline} color="text-slate-500" />
      </div>

      {/* Progress Bars */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Completion Rate</span>
              <span className="font-semibold text-emerald-600">{completionPct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Active (Completed + In Progress)</span>
              <span className="font-semibold text-blue-600">{activePct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all flex">
                <div className="h-full bg-emerald-500" style={{ width: `${completionPct}%` }} />
                <div className="h-full bg-blue-500" style={{ width: `${activePct - completionPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter size={14} /> Filter:
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "completed", "in-progress", "planned", "pipeline"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize ${
                filterStatus === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              }`}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
        <div className="md:ml-4 flex gap-2 flex-wrap">
          {[{ id: "all", name: "All Streams" }, ...roadmapStreams.map((s) => ({ id: s.id, name: s.name }))].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStream(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filterStream === s.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Roadmap Streams */}
      <div className="space-y-4">
        {filteredStreams.map((stream) => {
          const expanded = expandedStreams.has(stream.id);
          const streamCompleted = stream.items.filter((i) => i.status === "completed").length;
          const streamTotal = stream.items.length;

          return (
            <div key={stream.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Stream Header */}
              <button
                onClick={() => toggleStream(stream.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stream.color }} />
                  {expanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{stream.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stream.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{streamCompleted}/{streamTotal} done</span>
                  <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(streamCompleted / streamTotal) * 100}%` }} />
                  </div>
                </div>
              </button>

              {/* Items */}
              {expanded && (
                <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/50">
                  {stream.items.map((item) => {
                    const cfg = STATUS_CONFIG[item.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={item.id} className={`px-5 py-4 flex items-start gap-4 ${cfg.bg} border-l-4`}>
                        <Icon size={20} className={`mt-0.5 flex-shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</h4>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[item.priority]}`} title={`${item.priority} priority`} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{item.description}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} bg-white/50 dark:bg-slate-900/30`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-slate-400">{item.targetDate}</span>
                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{item.category}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredStreams.length === 0 && (
        <div className="text-center py-12 text-slate-400">No roadmap items match the current filters.</div>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
