"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { RuntimeChart } from "@/components/dashboard/RuntimeChart";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentExecutions } from "@/components/dashboard/RecentExecutions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_DASHBOARD_DATA } from "@/lib/queries";
import { calculateDashboardMetrics } from "@/lib/utils";
import type { ExecutionHistory, Operation, DashboardMetrics } from "@/lib/types";
import { Activity, Clock, Database, AlertCircle } from "lucide-react";

interface DashboardDataResponse {
  executionHistory: ExecutionHistory[];
  operations: Operation[];
}

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [rawOperations, setRawOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<DashboardDataResponse>(GET_DASHBOARD_DATA);
      const computed = calculateDashboardMetrics(
        data.executionHistory || [],
        data.operations || []
      );
      setMetrics(computed);
      setRawOperations(data.operations || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // Optional 15-second gentle polling to automatically reflect new traffic
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Dashboard Overview"
        subtitle="Intelligent GraphQL Execution Layer • Real-time Telemetry & Decision Observability"
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
        ) : metrics && metrics.totalRequests === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Requests"
                value={metrics?.totalRequests.toLocaleString() ?? 0}
                subtext="All-time gateway executions"
                icon={<Activity className="w-4 h-4 text-cyan-400" />}
                trendColor="cyan"
                isLoading={isLoading}
              />
              <StatCard
                title="Avg Latency"
                value={metrics?.avgLatency ?? 0}
                unit="ms"
                subtext="Execution & network duration"
                icon={<Clock className="w-4 h-4 text-indigo-400" />}
                trendColor="indigo"
                isLoading={isLoading}
              />
              <StatCard
                title="Cache Hit Rate"
                value={metrics ? `${metrics.cacheHitRate}%` : "0%"}
                subtext="Redis query resolution savings"
                icon={<Database className="w-4 h-4 text-emerald-400" />}
                trendColor="emerald"
                isLoading={isLoading}
              />
              <StatCard
                title="Failure Rate"
                value={metrics ? `${metrics.failureRate}%` : "0%"}
                subtext="Failed execution percentage"
                icon={<AlertCircle className="w-4 h-4 text-rose-400" />}
                trendColor={metrics && metrics.failureRate > 0 ? "rose" : "emerald"}
                isLoading={isLoading}
              />
            </div>

            {/* Charts Section: Runtime Distribution & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RuntimeChart
                distribution={metrics?.runtimeDistribution ?? []}
                totalRequests={metrics?.totalRequests ?? 0}
                isLoading={isLoading}
              />
              <PerformanceChart
                data={metrics?.performanceSeries ?? []}
                avgLatency={metrics?.avgLatency ?? 0}
                isLoading={isLoading}
              />
            </div>

            {/* Recent Executions Table */}
            <RecentExecutions
              executions={metrics?.recentExecutions ?? []}
              operations={rawOperations}
              isLoading={isLoading}
              viewAllLink={true}
            />
          </>
        )}
      </div>
    </div>
  );
}
