"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Boxes,
  Server,
  Layers,
  Route,
  History,
  Activity,
  Cpu,
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Organizations",
    href: "/organizations",
    icon: Building2,
  },
  {
    name: "Applications",
    href: "/applications",
    icon: Boxes,
  },
  {
    name: "GraphQL Services",
    href: "/services",
    icon: Server,
  },
  {
    name: "Operations",
    href: "/operations",
    icon: Layers,
  },
  {
    name: "Routing Policies",
    href: "/routing-policies",
    icon: Route,
  },
  {
    name: "Executions",
    href: "/dashboard/executions",
    icon: History,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col flex-shrink-0 backdrop-blur-xl h-screen">
      {/* Brand & Logo */}
      <div className="h-16 px-6 flex items-center border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-tight text-base font-mono">
              SpikeFlow
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-sans">
            GraphQL Execution Layer
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase font-mono">
          Management & Telemetry
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-slate-800/90 text-cyan-400 border border-slate-700/60 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Gateway Router
          </span>
          <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <Cpu className="w-3 h-3 text-slate-400" />
          <span>Dynamic Decision Layer</span>
        </div>
      </div>
    </aside>
  );
}
