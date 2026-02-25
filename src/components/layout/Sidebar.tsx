"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, DollarSign, ShoppingCart, Wrench,
  Headphones, Cloud, GraduationCap, Settings, Menu, X, Map,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/financial", label: "Financial", icon: DollarSign },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/cloud", label: "Cloud", icon: Cloud },
  { href: "/training", label: "Training", icon: GraduationCap },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-900 text-white p-2 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight">CES MBR Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Monthly Business Review</p>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
