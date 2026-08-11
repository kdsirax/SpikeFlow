"use client";

import { useState } from "react";
import type { ExecutionHistory, Operation } from "@/lib/types";
import { formatRelativeTime, normalizeRuntime } from "@/lib/utils";
import { ExecutionDetailsModal } from "./ExecutionDetailsModal";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface RecentExecutionsProps {
  executions: ExecutionHistory[];
  operations?: Operation[];
  isLoading?: boolean;
  viewAllLink?: boolean;
}

export function RecentExecutions({
  executions,
  operations = [],
  isLoading = false,
  viewAllLink = true,
}: RecentExecutionsProps) {
  const [selectedExecution, setSelectedExecution] = useState<ExecutionHistory | null>(null);

  const opMap = new Map<string, string>();
  for (const op of operations) {
    opMap.set(op.id, op.name);
  }

  const getRuntimeBadge = (runtime: string) => {
    const normalized = normalizeRuntime(runtime);
    switch (normalized.toLowerCase()) {
      case "docker":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
            Docker
          </span>
        );
      case "serverless":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950/60 text-amber-400 border border-amber-800/50">
            Serverless
          </span>
        );
      case "kubernetes":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-950/60 text-indigo-400 border border-indigo-800/50">
            Kubernetes
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {normalized}
          </span>
        );
    }
  };

  return (
    <>
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider">
              Recent Executions
            </h2>
            <p className="text-xs text-slate-400">
              Live log of GraphQL requests routed through SpikeFlow
            </p>
          </div>
          {viewAllLink && executions.length > 0 && (
            <Link
              href="/dashboard/executions"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-800/60 rounded animate-pulse w-full"></div>
            ))}
          </div>
        ) : executions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            No executions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Operation</th>
                  <th className="px-6 py-3.5 font-semibold">Runtime</th>
                  <th className="px-6 py-3.5 font-semibold">Cache</th>
                  <th className="px-6 py-3.5 font-semibold">Latency</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {executions.map((exec) => {
                  const opName = opMap.get(exec.operationId) || exec.operationId.slice(0, 8);
                  const isSuccess = exec.status === "SUCCESS";

                  return (
                    <tr
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Operation Name */}
                      <td className="px-6 py-3.5 font-sans font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{opName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({exec.operationId.slice(0, 6)})
                          </span>
                        </div>
                      </td>

                      {/* Runtime Badge */}
                      <td className="px-6 py-3.5">
                        {getRuntimeBadge(exec.runtimeChosen)}
                      </td>

                      {/* Cache Status */}
                      <td className="px-6 py-3.5">
                        {exec.cacheHit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                            HIT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            MISS
                          </span>
                        )}
                      </td>

                      {/* Latency */}
                      <td className="px-6 py-3.5 text-slate-300 font-semibold">
                        {exec.responseTime} ms
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            isSuccess
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                              : "bg-rose-950/60 text-rose-400 border-rose-800/50"
                          }`}
                        >
                          <span>●</span>
                          <span>{exec.status}</span>
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-6 py-3.5 text-right text-slate-400">
                        {formatRelativeTime(exec.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedExecution && (
        <ExecutionDetailsModal
          execution={selectedExecution}
          operationName={opMap.get(selectedExecution.operationId)}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </>
  );
}
