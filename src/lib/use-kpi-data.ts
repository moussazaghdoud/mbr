"use client";
import { useState, useEffect } from "react";
import { kpis, chartData, costCenters, servicesBreakdown } from "@/data/extracted-data";
import type { KPI, DataSeries, CostCenter } from "@/data/extracted-data";

export function useKPIData() {
  const [data, setData] = useState<KPI[]>(kpis);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Start with hardcoded data, then overlay with localStorage overrides
    let base = [...kpis];
    const stored = localStorage.getItem("ces-kpi-data");
    if (stored) {
      try {
        base = JSON.parse(stored);
      } catch {
        // keep base
      }
    }
    setData(base);

    // Fetch synced KPIs from DB and merge (synced data wins)
    fetch("/api/admin/sharepoint-sync/data")
      .then((res) => res.json())
      .then((json) => {
        if (json.kpis && json.kpis.length > 0) {
          const synced: KPI[] = json.kpis.map((k: Record<string, unknown>) => ({
            id: k.id as string,
            name: k.name as string,
            domain: (k.domain as KPI["domain"]) || "financial",
            value: k.value as number | string,
            unit: (k.unit as string) || "",
            period: (k.period as string) || "",
            target: k.target,
            targetUnit: k.targetUnit as string | undefined,
            variance: k.variance as string | undefined,
            varianceDirection: k.varianceDirection as KPI["varianceDirection"],
            gap: k.gap as string | undefined,
            editable: true,
          }));

          setData((prev) => {
            const merged = new Map<string, KPI>();
            // Base data first
            for (const kpi of prev) merged.set(kpi.id, kpi);
            // Synced data overwrites matching IDs, adds new ones
            for (const kpi of synced) merged.set(kpi.id, kpi);
            return Array.from(merged.values());
          });
        }
      })
      .catch(() => {
        // silently ignore — dashboard still works with local data
      })
      .finally(() => setLoaded(true));
  }, []);

  const getKPI = (id: string): KPI | undefined => data.find((k) => k.id === id);
  const getByDomain = (domain: string): KPI[] => data.filter((k) => k.domain === domain);

  return { kpis: data, getKPI, getByDomain, loaded, chartData, costCenters, servicesBreakdown };
}

export type { KPI, DataSeries, CostCenter };
