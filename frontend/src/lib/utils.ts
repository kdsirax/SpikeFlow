import type { ExecutionHistory, Operation, DashboardMetrics, RuntimeStat, PerformancePoint } from "./types";

export function calculateDashboardMetrics(
  history: ExecutionHistory[],
  operations: Operation[] = []
): DashboardMetrics {
  const totalRequests = history.length;

  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      avgLatency: 0,
      cacheHitRate: 0,
      failureRate: 0,
      runtimeDistribution: [],
      performanceSeries: [],
      recentExecutions: [],
    };
  }

  // Create operation ID -> Name lookup map
  const opMap = new Map<string, string>();
  for (const op of operations) {
    opMap.set(op.id, op.name);
  }

  // Latency & Cache calculations
  const totalLatency = history.reduce((sum, h) => sum + (h.responseTime || 0), 0);
  const avgLatency = Math.round(totalLatency / totalRequests);

  const cacheHits = history.filter((h) => h.cacheHit).length;
  const cacheHitRate = Math.round((cacheHits / totalRequests) * 100);

  const failures = history.filter((h) => h.status === "FAILED").length;
  const failureRate = Math.round((failures / totalRequests) * 100);

  // Runtime distribution calculation
  const runtimeCounts = new Map<string, number>();
  for (const h of history) {
    const r = normalizeRuntime(h.runtimeChosen);
    runtimeCounts.set(r, (runtimeCounts.get(r) || 0) + 1);
  }

  const runtimeDistribution: RuntimeStat[] = Array.from(runtimeCounts.entries()).map(
    ([runtime, count]) => ({
      runtime,
      count,
      percentage: Math.round((count / totalRequests) * 100),
    })
  );

  // Sort descending by count
  runtimeDistribution.sort((a, b) => b.count - a.count);

  // Performance timeline (chronological order, latest 30 points)
  const sortedChronological = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const performanceSeries: PerformancePoint[] = sortedChronological
    .slice(-30)
    .map((h) => {
      const d = new Date(h.createdAt);
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const opName = opMap.get(h.operationId) || h.operationId.slice(0, 8);

      return {
        id: h.id,
        time: timeStr,
        timestamp: d.getTime(),
        responseTime: h.responseTime,
        operationName: opName,
        runtime: normalizeRuntime(h.runtimeChosen),
        status: h.status,
        cacheHit: h.cacheHit,
      };
    });

  return {
    totalRequests,
    avgLatency,
    cacheHitRate,
    failureRate,
    runtimeDistribution,
    performanceSeries,
    recentExecutions: history.slice(0, 15),
  };
}

export function normalizeRuntime(runtime: string): string {
  const upper = (runtime || "").toUpperCase();
  if (upper === "DOCKER") return "Docker";
  if (upper === "SERVERLESS") return "Serverless";
  if (upper === "KUBERNETES") return "Kubernetes";
  if (upper === "CLOUDRUN") return "CloudRun";
  return runtime || "Unknown";
}

export function formatDate(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
