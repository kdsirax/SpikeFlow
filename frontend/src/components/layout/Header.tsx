"use client";

import { RefreshCw, Radio } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  lastUpdated?: Date | null;
}

export function Header({
  title,
  subtitle,
  onRefresh,
  isLoading = false,
  lastUpdated,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-8 flex items-center justify-between z-10">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 tracking-tight flex items-center gap-2.5">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 font-sans">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>Local Gateway (4000)</span>
        </div>

        {/* Last updated indicator */}
        {lastUpdated && (
          <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : "text-slate-300"}`} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        )}
      </div>
    </header>
  );
}
