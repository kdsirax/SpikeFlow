import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon: ReactNode;
  trendColor?: "emerald" | "rose" | "cyan" | "indigo" | "amber";
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  unit,
  subtext,
  icon,
  trendColor = "cyan",
  isLoading = false,
}: StatCardProps) {
  const colorStyles = {
    cyan: "text-cyan-400 bg-cyan-950/40 border-cyan-800/40",
    emerald: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
    rose: "text-rose-400 bg-rose-950/40 border-rose-800/40",
    indigo: "text-indigo-400 bg-indigo-950/40 border-indigo-800/40",
    amber: "text-amber-400 bg-amber-950/40 border-amber-800/40",
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-150 backdrop-blur-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-medium text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${colorStyles[trendColor]}`}
        >
          {icon}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-slate-800 animate-pulse rounded"></div>
          <div className="h-3 w-32 bg-slate-800 animate-pulse rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-slate-100 tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-mono font-medium text-slate-400">
                {unit}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1 font-sans truncate">
              {subtext}
            </p>
          )}
        </>
      )}
    </div>
  );
}
