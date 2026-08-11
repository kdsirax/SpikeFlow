"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { RecentExecutions } from "@/components/dashboard/RecentExecutions";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_EXECUTION_HISTORY } from "@/lib/queries";
import type { ExecutionHistory, Operation } from "@/lib/types";
import { Search, Filter } from "lucide-react";

interface ExecutionHistoryResponse {
  executionHistory: ExecutionHistory[];
  operations: Operation[];
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExecutionHistory[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cacheFilter, setCacheFilter] = useState("ALL");

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<ExecutionHistoryResponse>(GET_EXECUTION_HISTORY);
      setExecutions(data.executionHistory || []);
      setOperations(data.operations || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load execution history");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Build Operation Name Lookup Map
  const opMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const op of operations) {
      map.set(op.id, op.name);
    }
    return map;
  }, [operations]);

  // Filtered Executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((exec) => {
      const opName = (opMap.get(exec.operationId) || "").toLowerCase();
      const opId = exec.operationId.toLowerCase();
      const execId = exec.id.toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      // Search match
      if (q && !opName.includes(q) && !opId.includes(q) && !execId.includes(q)) {
        return false;
      }

      // Runtime filter
      if (runtimeFilter !== "ALL" && exec.runtimeChosen.toUpperCase() !== runtimeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && exec.status.toUpperCase() !== statusFilter) {
        return false;
      }

      // Cache filter
      if (cacheFilter === "HIT" && !exec.cacheHit) return false;
      if (cacheFilter === "MISS" && exec.cacheHit) return false;

      return true;
    });
  }, [executions, opMap, searchQuery, runtimeFilter, statusFilter, cacheFilter]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Execution History"
        subtitle="Complete persistent telemetry and decision audit log"
        onRefresh={() => fetchData(false)}
        isLoading={isRefreshing || isLoading}
        lastUpdated={lastUpdated}
      />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => fetchData(true)}
            isRetrying={isLoading}
          />
        ) : (
          <>
            {/* Filter Bar */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by operation or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Filter Selects */}
              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters:</span>
                </div>

                {/* Runtime Filter */}
                <select
                  value={runtimeFilter}
                  onChange={(e) => setRuntimeFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Runtimes</option>
                  <option value="DOCKER">Docker</option>
                  <option value="SERVERLESS">Serverless</option>
                  <option value="KUBERNETES">Kubernetes</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Cache Filter */}
                <select
                  value={cacheFilter}
                  onChange={(e) => setCacheFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Cache</option>
                  <option value="HIT">Cache HIT</option>
                  <option value="MISS">Cache MISS</option>
                </select>
              </div>
            </div>

            {/* Results count info */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>
                Showing {filteredExecutions.length} of {executions.length} executions
              </span>
            </div>

            {/* Executions Table */}
            <RecentExecutions
              executions={filteredExecutions}
              operations={operations}
              isLoading={isLoading}
              viewAllLink={false}
            />
          </>
        )}
      </div>
    </div>
  );
}
