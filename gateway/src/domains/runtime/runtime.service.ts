import type { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import type { ExecutionRequest, ExecutionResult, RuntimeExecutor } from "./runtime.types.js";
import { Runtime } from "../routing-policy/routing-policy.types.js";
import { DockerRuntimeExecutor, DockerExecutor } from "./docker.executor.js";
import { ServerlessRuntimeExecutor, ServerlessExecutor } from "./serverless.executor.js";
import { RuntimeExecutorService } from "./runtime-executor.service.js";

export {
  RuntimeExecutorService,
  DockerRuntimeExecutor,
  DockerExecutor,
  ServerlessRuntimeExecutor,
  ServerlessExecutor,
};

export class RuntimeService {
  private readonly executorService: RuntimeExecutorService;

  constructor(
    private readonly decisionEngineService?: DecisionEngineService,
    dockerExecutor: RuntimeExecutor = new DockerRuntimeExecutor(),
    serverlessExecutor: RuntimeExecutor = new ServerlessRuntimeExecutor()
  ) {
    this.executorService = new RuntimeExecutorService(dockerExecutor, serverlessExecutor);
  }

  registerExecutor(runtime: string | Runtime, executor: RuntimeExecutor): void {
    this.executorService.registerExecutor(runtime, executor);
  }

  getExecutor(runtime: string | Runtime): RuntimeExecutor | undefined {
    return this.executorService.getExecutor(runtime);
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    let context = { ...request };

    // If decision is not pre-attached and operationId is provided with decisionEngineService, evaluate decision
    if (!context.decision && context.operationId && this.decisionEngineService) {
      const decision = await this.decisionEngineService.makeRoutingDecision(context.operationId);
      context = { ...context, decision };
    }

    return this.executorService.execute(context);
  }
}
