import type { IOperationRepository } from "../operation/operation.repository.js";
import type { IRoutingPolicyRepository } from "../routing-policy/routing-policy.repository.js";
import type { MetricsService } from "../metrics/metrics.service.js";
import type { RoutingDecision } from "./decison-engine.types.js";
import { Runtime } from "../routing-policy/routing-policy.types.js";

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
      throw new Error(`Operation not found with ID: ${operationId}`);
    }

    const policies = await this.routingPolicyRepository.findAll();
    const policy = policies.find((p) => p.operationId === operationId);
    if (!policy) {
      throw new Error(`Routing policy not found for operation ID: ${operationId}`);
    }

    if (!policy.enabled) {
      return {
        runtime: policy.preferredRuntime || Runtime.DOCKER,
        reason: "Routing policy is disabled; defaulting to preferred runtime",
      };
    }

    if (metrics.cpuUsage > policy.cpuThreshold) {
      return {
        runtime: Runtime.SERVERLESS,
        reason: `CPU usage (${metrics.cpuUsage}%) exceeded policy threshold (${policy.cpuThreshold}%)`,
      };
    }

    if (metrics.requestsPerMinute > policy.requestThreshold) {
      return {
        runtime: Runtime.SERVERLESS,
        reason: `Requests per minute (${metrics.requestsPerMinute}) exceeded policy threshold (${policy.requestThreshold})`,
      };
    }

    return {
      runtime: Runtime.DOCKER,
      reason: "Metrics are within acceptable thresholds for Docker runtime",
    };
  }

  async makeDecision(operationId: string): Promise<RoutingDecision> {
    return this.makeRoutingDecision(operationId);
  }
}