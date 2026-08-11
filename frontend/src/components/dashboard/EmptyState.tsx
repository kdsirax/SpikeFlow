"use client";

import { Terminal, ArrowRight, Play } from "lucide-react";

export function EmptyState() {
  const exampleCurl = `curl -X POST http://localhost:4000/gateway \\
  -H "Content-Type: application/json" \\
  -d '{"query": "query GetProducts { products { id name } }"}'`;

  return (
    <div className="p-8 md:p-12 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm text-center max-w-2xl mx-auto my-6 space-y-6">
      <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
        <Play className="w-6 h-6 ml-0.5" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-100 font-sans">
          No executions yet
        </h3>
        <p className="text-sm text-slate-400 font-sans max-w-md mx-auto">
          Send a GraphQL request through the SpikeFlow Gateway to see live routing decisions, latency metrics, and runtime execution logs.
        </p>
      </div>

      {/* Code Sample */}
      <div className="text-left bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800/80">
          <span className="flex items-center gap-1.5 font-semibold">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Send Test Request
          </span>
          <span>POST /gateway</span>
        </div>
        <pre className="overflow-x-auto text-cyan-300 py-1 leading-relaxed">
          {exampleCurl}
        </pre>
      </div>

      <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-mono">
        <span>Refresh the dashboard after sending a request</span>
        <ArrowRight className="w-3 h-3 text-cyan-400" />
      </div>
    </div>
  );
}
