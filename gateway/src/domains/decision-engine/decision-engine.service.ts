import type { IOperationRepository } from "../operation/operation.repository.js";
import type { IRoutingPolicyRepository } from "../routing-policy/routing-policy.repository.js";
import type { MetricsService } from "../metrics/metrics.service.js";
import type { RoutingDecision } from "./decison-engine.types.js";
import { Runtime } from "../routing-policy/routing-policy.types.js";
import { logger } from "../../shared/logger/logger.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export class DecisionEngineService {
  constructor(
    private readonly operationRepository: IOperationRepository,
    private readonly routingPolicyRepository: IRoutingPolicyRepository,
    private readonly metricsService: MetricsService
  ) {}

  async makeRoutingDecision(operationId: string): Promise<RoutingDecision> {
    const metrics = this.metricsService.getMetrics();

    const operation = await this.operationRepository.findById(operationId);
    if (!operation) {
      throw new NotFoundError(`Operation not found with ID: ${operationId}`);
    }

    const policy = await this.routingPolicyRepository.findByOperationId(operationId);
    if (!policy) {
      throw new NotFoundError(`Routing policy not found for operation ID: ${operationId}`);
    }

    let decision: RoutingDecision;

    if (!policy.enabled) {
      decision = {
        runtime: policy.preferredRuntime || Runtime.DOCKER,
        reason: "Routing policy is disabled; defaulting to preferred runtime",
      };
    } else if (metrics.cpuUsage > policy.cpuThreshold) {
      decision = {
        runtime: Runtime.SERVERLESS,
        reason: `CPU usage (${metrics.cpuUsage}%) exceeded policy threshold (${policy.cpuThreshold}%)`,
      };
    } else if (metrics.requestsPerMinute > policy.requestThreshold) {
      decision = {
        runtime: Runtime.SERVERLESS,
        reason: `Requests per minute (${metrics.requestsPerMinute}) exceeded policy threshold (${policy.requestThreshold})`,
      };
    } else {
      decision = {
        runtime: Runtime.DOCKER,
        reason: "Metrics are within acceptable thresholds for Docker runtime",
      };
    }

    logger.info({ operationId, runtime: decision.runtime, reason: decision.reason }, "Decision made");
    return decision;
  }

  async makeDecision(operationId: string): Promise<RoutingDecision> {
    return this.makeRoutingDecision(operationId);
  }
}