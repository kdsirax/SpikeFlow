"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { PerformancePoint } from "@/lib/types";

interface PerformanceChartProps {
  data: PerformancePoint[];
  avgLatency: number;
  isLoading?: boolean;
}

export function PerformanceChart({
  data,
  avgLatency,
  isLoading = false,
}: PerformanceChartProps) {
  return (
    <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider">
              Request Performance
            </h2>
            <p className="text-xs text-slate-400">
              Execution latency timeline (ms) across recent operations
            </p>
          </div>
          {avgLatency > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-md">
              <span>Avg: {avgLatency} ms</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="space-y-3 w-full animate-pulse">
              <div className="h-44 bg-slate-800 rounded"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 text-xs font-mono border border-dashed border-slate-800 rounded-lg p-6">
            <p className="text-slate-300 font-medium mb-1">No latency metrics recorded yet</p>
            <p className="text-slate-400">Send GraphQL requests through SpikeFlow to populate latency timeline.</p>
          </div>
        ) : (
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  unit="ms"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as PerformancePoint;
                      return (
                        <div className="p-3 bg-slate-950/95 border border-slate-800 rounded-lg shadow-xl text-xs font-mono space-y-1 backdrop-blur-md">
                          <div className="text-slate-200 font-bold font-sans flex items-center justify-between gap-4">
                            <span>{d.operationName}</span>
                            <span className={d.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400"}>
                              ● {d.status}
                            </span>
                          </div>
                          <div className="text-cyan-400 font-bold text-sm">
                            {d.responseTime} ms
                          </div>
                          <div className="text-slate-400 flex items-center justify-between gap-4 text-[11px]">
                            <span>Runtime: <strong className="text-slate-300">{d.runtime}</strong></span>
                            <span>Cache: <strong className={d.cacheHit ? "text-emerald-400" : "text-slate-400"}>{d.cacheHit ? "HIT" : "MISS"}</strong></span>
                          </div>
                          <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                            {d.time}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {avgLatency > 0 && (
                  <ReferenceLine
                    y={avgLatency}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg ${avgLatency}ms`,
                      fill: "#06b6d4",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#06b6d4", stroke: "#0e7490", strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>Metric</span>
        <span className="text-slate-300">Execution Latency (performance.now)</span>
      </div>
    </div>
  );
}
