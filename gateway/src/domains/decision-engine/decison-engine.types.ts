import type { Runtime } from "../routing-policy/routing-policy.types.js";
import type { SystemMetrics } from "../metrics/metrics.types.js";

export type { SystemMetrics };

export interface RoutingDecision {
  runtime: Runtime;
  reason: string;
  cpuUsage?: number;
  memoryPercent?: number;
}