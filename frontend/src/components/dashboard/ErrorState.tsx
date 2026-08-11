"use client";

import { AlertTriangle, RefreshCw, ServerOff } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  message = "Unable to connect to SpikeFlow management API",
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="p-8 md:p-12 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center max-w-xl mx-auto my-8 space-y-5">
      <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
        <ServerOff className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-rose-200 font-sans">
          Unable to connect to SpikeFlow
        </h3>
        <p className="text-xs text-slate-300 font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 max-w-md mx-auto truncate">
          {message}
        </p>
        <p className="text-xs text-slate-400 font-sans pt-1">
          Make sure the SpikeFlow Gateway is running on <code className="font-mono text-slate-300">http://localhost:4000/graphql</code>
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Reconnecting..." : "Retry Connection"}</span>
        </button>
      )}
    </div>
  );
}
