"use client";

import type { RuntimeStat } from "@/lib/types";
import { Server, Zap, Cloud, Layers } from "lucide-react";

interface RuntimeChartProps {
  distribution: RuntimeStat[];
  totalRequests: number;
  isLoading?: boolean;
}

export function RuntimeChart({
  distribution,
  totalRequests,
  isLoading = false,
}: RuntimeChartProps) {
  const getRuntimeIcon = (runtime: string) => {
    switch (runtime.toLowerCase()) {
      case "docker":
        return <Server className="w-4 h-4 text-cyan-400" />;
      case "serverless":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "cloudrun":
        return <Cloud className="w-4 h-4 text-blue-400" />;
      case "kubernetes":
        return <Layers className="w-4 h-4 text-indigo-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRuntimeColor = (runtime: string) => {
    switch (runtime.toLowerCase()) {
      case "docker":
        return "bg-cyan-500";
      case "serverless":
        return "bg-amber-500";
      case "cloudrun":
        return "bg-blue-500";
      case "kubernetes":
        return "bg-indigo-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider">
              Runtime Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Live routing decisions executed across compute engines
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {totalRequests} Total
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="h-4 bg-slate-800 rounded animate-pulse w-full"></div>
            <div className="h-16 bg-slate-800 rounded animate-pulse w-full"></div>
          </div>
        ) : distribution.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs font-mono">
            No runtime data available yet.
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Multi-color Progress bar */}
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              {distribution.map((item) => (
                <div
                  key={item.runtime}
                  style={{ width: `${item.percentage}%` }}
                  className={`${getRuntimeColor(item.runtime)} transition-all duration-500`}
                  title={`${item.runtime}: ${item.percentage}% (${item.count} requests)`}
                />
              ))}
            </div>

            {/* List breakdown */}
            <div className="space-y-2.5 pt-2">
              {distribution.map((item) => (
                <div
                  key={item.runtime}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {getRuntimeIcon(item.runtime)}
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {item.runtime}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.count} {item.count === 1 ? "request" : "requests"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-slate-100">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>Decision Engine Strategy</span>
        <span className="text-cyan-400">Dynamic Heuristics</span>
      </div>
    </div>
  );
}
