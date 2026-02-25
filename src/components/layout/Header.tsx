"use client";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const periods = ["Q1'26", "Q4'25", "Q3'25", "Q2'25", "Q1'25", "Q4'24"];

export default function Header({ title }: { title?: string }) {
  const [dark, setDark] = useState(false);
  const [period, setPeriod] = useState("Q1'26");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !dark ? "dark" : "light");
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title || "Dashboard"}
      </h2>
      <div className="flex items-center gap-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 dark:text-white"
        >
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
