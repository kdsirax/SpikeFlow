import si from "systeminformation";
import { logger } from "../../shared/logger/logger.js";
export class MetricsService {
    /**
     * Returns current CPU load as a percentage (0–100).
     * systeminformation samples over ~100 ms — accurate on all platforms.
     */
    async getCPUUsage() {
        const load = await si.currentLoad();
        return Math.round(load.currentLoad * 10) / 10; // 1 decimal place
    }
    /**
     * Returns used / total memory and the usage percentage.
     */
    async getMemoryUsage() {
        const mem = await si.mem();
        const totalMB = Math.round(mem.total / 1024 / 1024);
        const usedMB = Math.round(mem.used / 1024 / 1024);
        const usagePercent = Math.round((mem.used / mem.total) * 1000) / 10; // 1 decimal place
        return { usedMB, totalMB, usagePercent };
    }
    /**
     * Returns a combined snapshot of CPU + memory with an ISO timestamp.
     * This is what the Decision Engine calls before every routing decision.
     */
    async getSystemMetrics() {
        const [cpuUsage, memoryUsage] = await Promise.all([
            this.getCPUUsage(),
            this.getMemoryUsage(),
        ]);
        const metrics = {
            cpuUsage,
            memoryUsage,
            timestamp: new Date().toISOString(),
        };
        logger.debug({ cpuUsage, memoryUsedMB: memoryUsage.usedMB, memoryPercent: memoryUsage.usagePercent }, "System metrics collected");
        return metrics;
    }
}
//# sourceMappingURL=metrics.service.js.map