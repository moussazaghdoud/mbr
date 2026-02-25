"use client";
import { useState, useEffect } from "react";
import { kpis, chartData, costCenters, servicesBreakdown } from "@/data/extracted-data";
import type { KPI, DataSeries, CostCenter } from "@/data/extracted-data";

export function useKPIData() {
  const [data, setData] = useState<KPI[]>(kpis);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ces-kpi-data");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(kpis);
      }
    }
    setLoaded(true);
  }, []);

  const getKPI = (id: string): KPI | undefined => data.find((k) => k.id === id);
  const getByDomain = (domain: string): KPI[] => data.filter((k) => k.domain === domain);

  return { kpis: data, getKPI, getByDomain, loaded, chartData, costCenters, servicesBreakdown };
}

export type { KPI, DataSeries, CostCenter };
