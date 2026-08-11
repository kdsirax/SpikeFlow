"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_OPERATIONS } from "@/lib/queries";
import type { Operation, GraphQLService, RoutingPolicy } from "@/lib/types";
import { Layers, Database, Zap, Cpu, Server, ShieldCheck, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface OperationsResponse {
  operations: Operation[];
  graphqlServices: GraphQLService[];
  routingPolicies: RoutingPolicy[];
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [services, setServices] = useState<GraphQLService[]>([]);
  const [policies, setPolicies] = useState<RoutingPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<OperationsResponse>(GET_OPERATIONS);
      setOperations(data.operations || []);
      setServices(data.graphqlServices || []);
      setPolicies(data.routingPolicies || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load operations");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Lookup maps
  const serviceMap = useMemo(() => {
    const map = new Map<string, GraphQLService>();
    for (const s of services) {
      map.set(s.id, s);
    }
    return map;
  }, [services]);

  const policyMap = useMemo(() => {
    const map = new Map<string, RoutingPolicy>();
    for (const p of policies) {
      map.set(p.operationId, p);
    }
    return map;
  }, [policies]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Operations Registry"
        subtitle="Registered GraphQL operations, cost heuristics, and dynamic routing policies"
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
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
            {/* Header info */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Registered Operations ({operations.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  AST metadata automatically extracted and cached in Redis
                </p>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-800/60 rounded animate-pulse w-full"></div>
                ))}
              </div>
            ) : operations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">
                No operations registered yet in SpikeFlow.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Operation Name</th>
                      <th className="px-6 py-3.5 font-semibold">Type</th>
                      <th className="px-6 py-3.5 font-semibold">Upstream Service</th>
                      <th className="px-6 py-3.5 font-semibold">Priority & Cost</th>
                      <th className="px-6 py-3.5 font-semibold">Cache & DB</th>
                      <th className="px-6 py-3.5 font-semibold">Routing Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {operations.map((op) => {
                      const svc = serviceMap.get(op.graphQLServiceId);
                      const policy = policyMap.get(op.id);

                      return (
                        <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Operation Name */}
                          <td className="px-6 py-4">
                            <div className="font-sans font-bold text-slate-100 text-sm">
                              {op.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {op.id.slice(0, 8)}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                                op.type === "QUERY"
                                  ? "bg-cyan-950/60 text-cyan-400 border-cyan-800/50"
                                  : "bg-purple-950/60 text-purple-400 border-purple-800/50"
                              }`}
                            >
                              {op.type}
                            </span>
                          </td>

                          {/* Upstream Service */}
                          <td className="px-6 py-4">
                            <div className="text-slate-200 font-medium font-sans">
                              {svc?.name || "Unknown Service"}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {svc?.endpoint || "-"}
                            </div>
                          </td>

                          {/* Priority & Cost */}
                          <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">Priority:</span>
                              <span className="text-slate-200 font-bold">{op.priority}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <span>Cost:</span>
                              <span className="text-slate-300">{op.estimatedCost}</span>
                            </div>
                          </td>

                          {/* Cache & DB */}
                          <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Database className="w-3 h-3 text-cyan-400" />
                              <span className="text-slate-300">
                                Cacheable: <strong>{op.cacheable ? "Yes" : "No"}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Server className="w-3 h-3 text-slate-400" />
                              <span>DB Req: {op.requiresDatabase ? "Yes" : "No"}</span>
                            </div>
                          </td>

                          {/* Routing Policy */}
                          <td className="px-6 py-4">
                            {policy ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-slate-200 font-bold">
                                    {policy.preferredRuntime}
                                  </span>
                                  {policy.enabled ? (
                                    <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-1 rounded">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  CPU Threshold: <strong className="text-cyan-400">{policy.cpuThreshold}%</strong>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                Default Docker
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
