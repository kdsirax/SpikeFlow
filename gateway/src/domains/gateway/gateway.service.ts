import crypto from "crypto";
import { GraphQLParserService } from "./graphql-parser.service.js";
import { RequestResolverService } from "./request-resolver.service.js";
import { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import { RuntimeExecutorService } from "../runtime/runtime-executor.service.js";
import type { RuntimeService } from "../runtime/runtime.service.js";
import type { ExecutionHistoryService } from "../execution-history/execution-history.service.js";
import type { CreateExecutionHistoryInput } from "../execution-history/execution-history.types.js";
import type { GatewayForwardRequest, GatewayForwardResult } from "./gateway.types.js";
import { logger } from "../../shared/logger/logger.js";

export class GatewayService {
  constructor(
    private readonly graphqlParserService: GraphQLParserService,
    private readonly requestResolverService: RequestResolverService,
    private readonly decisionEngineService: DecisionEngineService,
    private readonly runtimeExecutorService: RuntimeExecutorService | RuntimeService,
    private readonly executionHistoryService?: ExecutionHistoryService
  ) {}

  /**
   * Orchestrates automatic GraphQL request resolution, execution, and observability:
   * 1. Generates / captures request ID.
   * 2. Parses query AST to extract operation name and type.
   * 3. Resolves operation metadata, routing policy, and GraphQL service via Redis / Postgres.
   * 4. Evaluates system metrics (CPU, Memory) via Decision Engine.
   * 5. Delegates execution to RuntimeExecutorService (Docker, Serverless, Lambda, etc.).
   * 6. Measures execution latency via performance.now().
   * 7. Records ExecutionHistory record (isolated: DB write failures do not break client response).
   * 8. Emits structured telemetry log via Pino.
   * 9. Returns execution response verbatim.
   */
  async forward(request: GatewayForwardRequest): Promise<GatewayForwardResult> {
    const requestId = request.requestId || crypto.randomUUID();
    const { query, variables } = request;

    // ── Phase 1: Parse GraphQL Query AST ───────────────────────────────────
    const { operationType, operationName } = this.graphqlParserService.parse(query);

    logger.debug({ requestId, operationName, operationType }, "Extracted GraphQL operation from query AST");

    // ── Phase 2 & 4: Resolve Request via Redis / Postgres ──────────────────
    const { operation, routingPolicy, graphqlService, cacheHit } =
      await this.requestResolverService.resolve(operationName);

    // ── Phase 5: Runtime Decision (CPU + Memory evaluation) ─────────────────
    const decision = await this.decisionEngineService.makeRoutingDecision(operation.id);

    const forwardUrl = graphqlService.endpoint;

    logger.debug(
      {
        requestId,
        operationName,
        serviceName: graphqlService.name,
        runtime: decision.runtime,
        reason: decision.reason,
        forwardUrl,
      },
      "Prepared execution context for Runtime Executor"
    );

    // ── Phase 6: Delegate Execution & Measure Latency ───────────────────────
    let result: GatewayForwardResult;
    const executionStartTime = performance.now();

    try {
      result = (await this.runtimeExecutorService.execute({
        query,
        variables,
        operationName,
        requestId,
        targetUrl: forwardUrl,
        decision,
        operationId: operation.id,
        metadata: {
          serviceName: graphqlService.name,
          cacheHit,
        },
      })) as GatewayForwardResult;
    } catch (executionError) {
      const responseTime = Math.round(performance.now() - executionStartTime);

      // Record failed execution attempt safely
      await this.recordHistorySafely({
        operationId: operation.id,
        runtimeChosen: decision.runtime,
        decisionReason: decision.reason,
        cpuUsage: decision.cpuUsage,
        memoryUsage: decision.memoryPercent,
        cacheHit,
        responseTime,
        status: "FAILED",
      });

      throw executionError;
    }

    const responseTime = Math.round(performance.now() - executionStartTime);

    // ── Phase 7: Record Execution History (Persistent Observability) ────────
    await this.recordHistorySafely({
      operationId: operation.id,
      runtimeChosen: decision.runtime,
      decisionReason: decision.reason,
      cpuUsage: decision.cpuUsage,
      memoryUsage: decision.memoryPercent,
      cacheHit,
      responseTime,
      status: "SUCCESS",
    });

    // ── Phase 8: Structured Telemetry Logging ──────────────────────────────
    logger.info(
      {
        requestId,
        operation: operationName,
        operationName,
        selectedRuntime: decision.runtime,
        runtimeSelected: decision.runtime,
        reason: decision.reason,
        executionTime: `${responseTime}ms`,
        responseTime: `${responseTime}ms`,
        targetUrl: forwardUrl,
        forwardUrl,
        cacheStatus: cacheHit ? "HIT" : "MISS",
        graphqlService: graphqlService.name,
        cpu: `${decision.cpuUsage ?? 0}%`,
        memory: `${decision.memoryPercent ?? 0}%`,
      },
      "GraphQL request resolved and executed successfully"
    );

    return result;
  }

  /**
   * Safely records execution history without interrupting the client flow.
   * If database persistence fails, logs an error but ensures client response is delivered.
   */
  private async recordHistorySafely(input: CreateExecutionHistoryInput): Promise<void> {
    if (!this.executionHistoryService) {
      return;
    }

    try {
      await this.executionHistoryService.recordExecution(input);
    } catch (historyError) {
      logger.error(
        {
          error: historyError instanceof Error ? historyError.message : String(historyError),
          operationId: input.operationId,
        },
        "Failed to record execution history"
      );
    }
  }
}
