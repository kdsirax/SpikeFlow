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
      {/* Brand & Official Logo */}
      <div className="h-16 px-5 flex items-center border-b border-slate-800/80 gap-3">
        {/* Hexagonal Network Flow Icon */}
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="sidebarFlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
              <linearGradient id="sidebarHexBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1e293b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Hexagon Outline */}
            <polygon
              points="50,6 88,28 88,72 50,94 12,72 12,28"
              fill="#090d16"
              stroke="url(#sidebarHexBorder)"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Network Connections */}
            <g stroke="#334155" strokeWidth="1.8" opacity="0.85">
              <line x1="28" y1="42" x2="48" y2="28" />
              <line x1="48" y1="28" x2="68" y2="40" />
              <line x1="28" y1="42" x2="35" y2="70" />
              <line x1="35" y1="70" x2="65" y2="68" />
              <line x1="68" y1="40" x2="65" y2="68" />
              <line x1="48" y1="28" x2="48" y2="52" />
            </g>

            {/* Network Nodes */}
            <circle cx="48" cy="28" r="4" fill="#0284c7" />
            <circle cx="28" cy="42" r="3.5" fill="#0369a1" />
            <circle cx="68" cy="40" r="3.5" fill="#0d9488" />
            <circle cx="35" cy="70" r="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="65" cy="68" r="3.5" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />

            {/* Dynamic Ascending Flow Curve with Arrow */}
            <path
              d="M 22 68 Q 36 68, 46 52 T 76 34"
              fill="none"
              stroke="url(#sidebarFlowGrad)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="22" cy="68" r="4" fill="#0284c7" stroke="#fff" strokeWidth="1.5" />
            <polygon
              points="74,25 86,30 78,40 76,33"
              fill="#14b8a6"
            />
          </svg>
        </div>

        {/* Text Logo */}
        <div>
          <div className="flex items-center">
            <span className="font-bold text-slate-100 tracking-tight text-base font-sans">
              Spike
            </span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 tracking-tight text-base font-sans">
              Flow
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate font-sans tracking-wide">
            Intelligent. Adaptive. Scalable.
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
