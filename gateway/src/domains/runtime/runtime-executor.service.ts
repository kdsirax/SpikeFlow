import { Runtime } from "../routing-policy/routing-policy.types.js";
import type { ExecutionRequest, ExecutionResult, RuntimeExecutor } from "./runtime.types.js";
import { DockerRuntimeExecutor } from "./docker.executor.js";
import { ServerlessRuntimeExecutor } from "./serverless.executor.js";
import { logger } from "../../shared/logger/logger.js";

export class RuntimeExecutorService {
  private readonly executors = new Map<string, RuntimeExecutor>();

  constructor(
    dockerExecutor: RuntimeExecutor = new DockerRuntimeExecutor(),
    serverlessExecutor: RuntimeExecutor = new ServerlessRuntimeExecutor()
  ) {
    this.registerExecutor(Runtime.DOCKER, dockerExecutor);
    this.registerExecutor(Runtime.SERVERLESS, serverlessExecutor);
  }

  /**
   * Registers a new RuntimeExecutor for a specified runtime identifier.
   * Enables open/closed pluggability for future runtimes (e.g. Lambda, CloudRun, Kubernetes).
   */
  registerExecutor(runtime: string | Runtime, executor: RuntimeExecutor): void {
    const key = this.normalizeKey(runtime);
    this.executors.set(key, executor);
    logger.debug({ runtime: key }, "Registered runtime executor");
  }

  /**
   * Retrieves the registered executor for a given runtime.
   */
  getExecutor(runtime: string | Runtime): RuntimeExecutor | undefined {
    return this.executors.get(this.normalizeKey(runtime));
  }

  /**
   * Checks if an executor exists for a given runtime.
   */
  hasExecutor(runtime: string | Runtime): boolean {
    return this.executors.has(this.normalizeKey(runtime));
  }

  /**
   * Forwards execution explicitly to the Docker runtime executor.
   */
  async forwardToDocker(request: ExecutionRequest): Promise<ExecutionResult> {
    const executor = this.getExecutor(Runtime.DOCKER);
    if (!executor) {
      throw new Error("No Docker runtime executor registered.");
    }
    return executor.execute(request);
  }

  /**
   * Forwards execution explicitly to the Serverless runtime executor.
   */
  async forwardToServerless(request: ExecutionRequest): Promise<ExecutionResult> {
    const executor = this.getExecutor(Runtime.SERVERLESS);
    if (!executor) {
      throw new Error("No Serverless runtime executor registered.");
    }
    return executor.execute(request);
  }

  /**
   * Executes the request using the runtime specified in request.decision.
   * Routes to forwardToDocker, forwardToServerless, or any dynamically registered executor.
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const runtimeKey = request.decision?.runtime ?? Runtime.DOCKER;
    const normalizedKey = this.normalizeKey(runtimeKey);

    logger.debug(
      {
        operationName: request.operationName,
        runtime: runtimeKey,
        reason: request.decision?.reason,
      },
      "RuntimeExecutorService dispatching execution"
    );

    if (normalizedKey === Runtime.DOCKER) {
      return this.forwardToDocker(request);
    }

    if (normalizedKey === Runtime.SERVERLESS) {
      return this.forwardToServerless(request);
    }

    const customExecutor = this.executors.get(normalizedKey);
    if (!customExecutor) {
      throw new Error(
        `Unsupported runtime: '${runtimeKey}'. No registered executor found.`
      );
    }

    return customExecutor.execute(request);
  }

  private normalizeKey(runtime: string | Runtime): string {
    return String(runtime).trim().toUpperCase();
  }
}
