import type { SystemMetrics } from "./metrics.types.js";

export class MetricsService {
  getMetrics(): SystemMetrics {
    return {
      cpuUsage: 75,
      memoryUsage: 62,
      requestsPerMinute: 850,
    };
  }
}
