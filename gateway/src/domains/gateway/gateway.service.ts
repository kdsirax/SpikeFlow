import crypto from "crypto";
import { GraphQLParserService } from "./graphql-parser.service.js";
import { RequestResolverService } from "./request-resolver.service.js";
import { DecisionEngineService } from "../decision-engine/decision-engine.service.js";
import { RuntimeService } from "../runtime/runtime.service.js";
import type { GatewayForwardRequest, GatewayForwardResult } from "./gateway.types.js";
import { logger } from "../../shared/logger/logger.js";

export class GatewayService {
  constructor(
    private readonly graphqlParserService: GraphQLParserService,
    private readonly requestResolverService: RequestResolverService,
    private readonly decisionEngineService: DecisionEngineService,
    private readonly runtimeService: RuntimeService
  ) {}

  /**
   * Orchestrates automatic GraphQL request resolution and forwarding:
   * 1. Generates / captures request ID and starts telemetry timer.
   * 2. Parses query AST to extract operation name and type.
   * 3. Resolves operation metadata, routing policy, and GraphQL service via Redis / Postgres.
   * 4. Evaluates system metrics (CPU, Memory) via Decision Engine.
   * 5. Forwards GraphQL payload to upstream service endpoint.
   * 6. Emits structured telemetry log via Pino.
   * 7. Returns upstream response verbatim.
   */
  async forward(request: GatewayForwardRequest): Promise<GatewayForwardResult> {
    const requestId = request.requestId || crypto.randomUUID();
    const startTime = Date.now();
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
        forwardUrl,
      },
      "Prepared upstream forwarding"
    );

    // ── Forward Request to Upstream GraphQL Service ─────────────────────────
    const upstreamResponse = await fetch(forwardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        query,
        operationName,
        ...(variables !== undefined && { variables }),
      }),
    });

    if (!upstreamResponse.ok) {
      logger.error(
        {
          requestId,
          operationName,
          serviceName: graphqlService.name,
          forwardUrl,
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
        },
        "Upstream GraphQL service returned a non-2xx status"
      );
      throw new Error(
        `Upstream service responded with ${upstreamResponse.status} ${upstreamResponse.statusText}`
      );
    }

    const result = (await upstreamResponse.json()) as GatewayForwardResult;
    const responseTimeMs = Date.now() - startTime;

    // ── Phase 8: Structured Telemetry Logging ──────────────────────────────
    logger.info(
      {
        requestId,
        operationName,
        cacheStatus: cacheHit ? "HIT" : "MISS",
        graphqlService: graphqlService.name,
        cpu: `${decision.cpuUsage ?? 0}%`,
        memory: `${decision.memoryPercent ?? 0}%`,
        runtimeSelected: decision.runtime,
        forwardUrl,
        responseTime: `${responseTimeMs}ms`,
      },
      "GraphQL request resolved and forwarded successfully"
    );

    return result;
  }
}
