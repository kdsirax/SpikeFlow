"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_SERVICES } from "@/lib/queries";
import type { GraphQLService, Operation } from "@/lib/types";
import { Server, Globe, Activity, Calendar, Layers } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ServicesResponse {
  graphqlServices: GraphQLService[];
  operations: Operation[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<GraphQLService[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<ServicesResponse>(GET_SERVICES);
      setServices(data.graphqlServices || []);
      setOperations(data.operations || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Compute operations count per service
  const opCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const op of operations) {
      counts.set(op.graphQLServiceId, (counts.get(op.graphQLServiceId) || 0) + 1);
    }
    return counts;
  }, [operations]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="GraphQL Services"
        subtitle="Registered upstream subgraph and microservice endpoints"
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
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <span className="text-xs font-mono text-slate-400 uppercase">Total Services</span>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{services.length}</div>
              </div>
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <span className="text-xs font-mono text-slate-400 uppercase">Total Operations</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{operations.length}</div>
              </div>
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <span className="text-xs font-mono text-slate-400 uppercase">Architecture</span>
                <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">Multi-Runtime Subgraphs</div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse p-6"></div>
                ))
              ) : services.length === 0 ? (
                <div className="col-span-2 p-12 text-center text-slate-400 text-xs font-mono bg-slate-900/40 rounded-xl border border-slate-800">
                  No upstream GraphQL services registered yet.
                </div>
              ) : (
                services.map((svc) => {
                  const opsCount = opCounts.get(svc.id) || 0;

                  return (
                    <div
                      key={svc.id}
                      className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all backdrop-blur-sm space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                              <Server className="w-4 h-4" />
                            </div>
                            <h3 className="text-base font-bold text-slate-100 font-sans">
                              {svc.name}
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            {svc.environment}
                          </span>
                        </div>

                        {/* Endpoint URL */}
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 font-mono text-xs text-slate-300">
                          <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="truncate select-all">{svc.endpoint}</span>
                        </div>
                      </div>

                      {/* Stats & Timestamps */}
                      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{opsCount} Operations</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(svc.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
