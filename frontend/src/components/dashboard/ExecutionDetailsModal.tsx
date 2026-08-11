"use client";

import { X, CheckCircle2, XCircle, Clock, Cpu, Server, Database, Hash, Calendar, ShieldAlert } from "lucide-react";
import type { ExecutionHistory } from "@/lib/types";
import { formatDate, normalizeRuntime } from "@/lib/utils";

interface ExecutionDetailsModalProps {
  execution: ExecutionHistory | null;
  operationName?: string;
  onClose: () => void;
}

export function ExecutionDetailsModal({
  execution,
  operationName,
  onClose,
}: ExecutionDetailsModalProps) {
  if (!execution) return null;

  const isSuccess = execution.status === "SUCCESS";
  const normalizedRuntimeName = normalizeRuntime(execution.runtimeChosen);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isSuccess
                  ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-400"
                  : "bg-rose-950/50 border-rose-800/60 text-rose-400"
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{operationName || "GraphQL Operation"}</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    isSuccess
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                      : "bg-rose-950/80 text-rose-400 border-rose-800/60"
                  }`}
                >
                  ● {execution.status}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                ID: {execution.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Main Key-Value Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Runtime */}
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-cyan-400" />
                Runtime
              </div>
              <div className="font-semibold text-slate-200 font-mono">
                {normalizedRuntimeName}
              </div>
            </div>

            {/* Latency */}
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                Latency
              </div>
              <div className="font-semibold text-slate-200 font-mono">
                {execution.responseTime} ms
              </div>
            </div>

            {/* Cache Hit */}
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-cyan-400" />
                Cache
              </div>
              <div
                className={`font-semibold font-mono ${
                  execution.cacheHit ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {execution.cacheHit ? "HIT (Redis)" : "MISS"}
              </div>
            </div>

            {/* CPU Usage */}
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-indigo-400" />
                CPU Usage
              </div>
              <div className="font-semibold text-slate-200 font-mono">
                {execution.cpuUsage !== null && execution.cpuUsage !== undefined
                  ? `${execution.cpuUsage}%`
                  : "N/A"}
              </div>
            </div>

            {/* Memory Usage */}
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Memory Usage
              </div>
              <div className="font-semibold text-slate-200 font-mono">
                {execution.memoryUsage !== null && execution.memoryUsage !== undefined
                  ? `${execution.memoryUsage}%`
                  : "N/A"}
              </div>
            </div>

            {/* Timestamp */}
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-mono uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                Time
              </div>
              <div className="font-semibold text-slate-200 text-xs font-mono truncate">
                {new Date(execution.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Decision Reason Section */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1.5">
            <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              Decision Engine Reason
            </div>
            <p className="text-sm font-mono text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
              {execution.decisionReason || "Standard routing policy evaluation (metrics within healthy threshold)"}
            </p>
          </div>

          {/* Technical IDs */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 py-1">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Execution UUID
              </span>
              <span className="text-slate-300 select-all">{execution.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Operation ID
              </span>
              <span className="text-slate-300 select-all">{execution.operationId}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 py-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Executed At
              </span>
              <span className="text-slate-300">{formatDate(execution.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
