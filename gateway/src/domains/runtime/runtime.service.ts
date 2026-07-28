import type { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import type { ExecutionRequest, ExecutionResult, RuntimeExecutor } from "./runtime.types.js";
import { Runtime } from "../routing-policy/routing-policy.types.js";
import { DockerExecutor } from "./docker.executor.js";
import { ServerlessExecutor } from "./serverless.executor.js";

export class RuntimeService {
  constructor(
    private readonly decisionEngineService: DecisionEngineService,
    private readonly dockerExecutor: RuntimeExecutor = new DockerExecutor(),
    private readonly serverlessExecutor: RuntimeExecutor = new ServerlessExecutor()
  ) {}

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const decision = await this.decisionEngineService.makeRoutingDecision(request.operationId);

    if (decision.runtime === Runtime.SERVERLESS) {
      return this.serverlessExecutor.execute(request);
    }

    return this.dockerExecutor.execute(request);
  }
}
