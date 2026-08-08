import { Runtime } from "../routing-policy/routing-policy.types.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
export class DecisionEngineService {
    operationRepository;
    routingPolicyRepository;
    metricsService;
    constructor(operationRepository, routingPolicyRepository, metricsService) {
        this.operationRepository = operationRepository;
        this.routingPolicyRepository = routingPolicyRepository;
        this.metricsService = metricsService;
    }
    async makeRoutingDecision(operationId) {
        // ── Collect real system metrics ────────────────────────────────────────
        const metrics = await this.metricsService.getSystemMetrics();
        const operation = await this.operationRepository.findById(operationId);
        if (!operation) {
            throw new NotFoundError(`Operation not found with ID: ${operationId}`);
        }
        const policy = await this.routingPolicyRepository.findByOperationId(operationId);
        if (!policy) {
            throw new NotFoundError(`Routing policy not found for operation ID: ${operationId}`);
        }
        logger.debug({
            operationId,
            cpuUsage: metrics.cpuUsage,
            memoryPercent: metrics.memoryUsage.usagePercent,
            cpuThreshold: policy.cpuThreshold,
            requestThreshold: policy.requestThreshold,
            metricsTimestamp: metrics.timestamp,
        }, "Evaluating routing policy against real metrics");
        let decision;
        if (!policy.enabled) {
            decision = {
                runtime: policy.preferredRuntime || Runtime.DOCKER,
                reason: "Routing policy is disabled; defaulting to preferred runtime",
            };
        }
        else if (metrics.cpuUsage > policy.cpuThreshold) {
            decision = {
                runtime: Runtime.SERVERLESS,
                reason: `CPU usage (${metrics.cpuUsage}%) exceeded policy threshold (${policy.cpuThreshold}%)`,
            };
        }
        else if (metrics.memoryUsage.usagePercent > policy.requestThreshold) {
            // requestThreshold is reused as a memory% threshold until schema is extended
            decision = {
                runtime: Runtime.SERVERLESS,
                reason: `Memory usage (${metrics.memoryUsage.usagePercent}%) exceeded policy threshold (${policy.requestThreshold}%)`,
            };
        }
        else {
            decision = {
                runtime: Runtime.DOCKER,
                reason: `Metrics within thresholds — CPU ${metrics.cpuUsage}%, Memory ${metrics.memoryUsage.usagePercent}%`,
            };
        }
        logger.info({ operationId, runtime: decision.runtime, reason: decision.reason }, "Decision made");
        return decision;
    }
    async makeDecision(operationId) {
        return this.makeRoutingDecision(operationId);
    }
}
//# sourceMappingURL=decision-engine.service.js.map