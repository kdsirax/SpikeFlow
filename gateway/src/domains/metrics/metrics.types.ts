export interface MemoryUsage {
  usedMB: number;
  totalMB: number;
  usagePercent: number;
}

export interface SystemMetrics {
  cpuUsage: number;       // percentage 0-100
  memoryUsage: MemoryUsage;
  timestamp: string;      // ISO 8601
}
