import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import http from "http";
import express from "express";
import { GraphQLParserService } from "./domains/gateway/graphql-parser.service.js";
import { RequestResolverService } from "./domains/gateway/request-resolver.service.js";
import { GatewayService } from "./domains/gateway/gateway.service.js";
import { createGatewayRouter } from "./domains/gateway/gateway.router.js";
import { DecisionEngineService } from "./domains/decision-engine/decision-engine.service.js";
import { RuntimeService } from "./domains/runtime/runtime.service.js";
import { MetricsService } from "./domains/metrics/metrics.service.js";
import { CacheService } from "./shared/cache/cache.service.js";
import { Runtime } from "./domains/routing-policy/routing-policy.types.js";
import type { IOperationRepository } from "./domains/operation/operation.repository.js";
import type { IGraphQLServiceRepository } from "./domains/graphql-service/graphql-service.repository.js";
import type { IRoutingPolicyRepository } from "./domains/routing-policy/routing-policy.repository.js";
import type { Operation } from "./domains/operation/operation.types.js";
import type { GraphQLService } from "./domains/graphql-service/graphql-service.types.js";
import type { RoutingPolicy } from "./domains/routing-policy/routing-policy.types.js";
import { logger } from "./shared/logger/logger.js";

// ── In-Memory Cache for Test ────────────────────────────────────────────────
class InMemoryCacheService extends CacheService {
  private store = new Map<string, string>();

  override async get<T>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  }

  override async set<T>(key: string, value: T, _ttl?: number): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  override async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ── Mock Repositories ───────────────────────────────────────────────────────
class MockOperationRepository implements IOperationRepository {
  public operations: Operation[] = [];

  async create(data: any): Promise<Operation> {
    const op: Operation = {
      id: "op-" + Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    this.operations.push(op);
    return op;
  }

  async findAll(): Promise<Operation[]> {
    return this.operations;
  }

  async findById(id: string): Promise<Operation | null> {
    return this.operations.find((op) => op.id === id) || null;
  }

  async findByName(name: string): Promise<Operation | null> {
    return this.operations.find((op) => op.name === name) || null;
  }

  async findByGraphQLServiceId(graphQLServiceId: string): Promise<Operation[]> {
    return this.operations.filter((op) => op.graphQLServiceId === graphQLServiceId);
  }
}

class MockGraphQLServiceRepository implements IGraphQLServiceRepository {
  public services: GraphQLService[] = [];

  async create(data: any): Promise<GraphQLService> {
    const svc: GraphQLService = {
      id: "svc-" + Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    this.services.push(svc);
    return svc;
  }

  async findAll(): Promise<GraphQLService[]> {
    return this.services;
  }

  async findById(id: string): Promise<GraphQLService | null> {
    return this.services.find((s) => s.id === id) || null;
  }

  async findByName(name: string): Promise<GraphQLService | null> {
    return this.services.find((s) => s.name === name) || null;
  }

  async findByEndpoint(endpoint: string): Promise<GraphQLService | null> {
    return this.services.find((s) => s.endpoint === endpoint) || null;
  }

  async findByApplicationId(applicationId: string): Promise<GraphQLService[]> {
    return this.services.filter((s) => s.applicationId === applicationId);
  }
}

class MockRoutingPolicyRepository implements IRoutingPolicyRepository {
  public policies: RoutingPolicy[] = [];

  async create(data: any): Promise<RoutingPolicy> {
    const policy: RoutingPolicy = {
      id: "pol-" + Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    this.policies.push(policy);
    return policy;
  }

  async findAll(): Promise<RoutingPolicy[]> {
    return this.policies;
  }

  async findById(id: string): Promise<RoutingPolicy | null> {
    return this.policies.find((p) => p.id === id) || null;
  }

  async findByOperationId(operationId: string): Promise<RoutingPolicy | null> {
    return this.policies.find((p) => p.operationId === operationId) || null;
  }
}

async function runSprint20Tests() {
  console.log("\n=======================================================");
  console.log("🚀 Starting Sprint 20 Automatic GraphQL Resolution Tests");
  console.log("=======================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ── 1. Test GraphQLParserService ──────────────────────────────────────────
  console.log("\n--- Phase 1: GraphQLParserService Tests ---");
  const parser = new GraphQLParserService();

  // Test 1.1: Standard named query
  const queryResult = parser.parse(`
    query GetProducts {
      products {
        id
        name
      }
    }
  `);
  assert(queryResult.operationType === "query", "Parser correctly extracts operationType 'query'");
  assert(queryResult.operationName === "GetProducts", "Parser correctly extracts operationName 'GetProducts'");

  // Test 1.2: Named mutation
  const mutationResult = parser.parse(`
    mutation CreateUser($input: UserInput!) {
      createUser(input: $input) {
        id
      }
    }
  `);
  assert(mutationResult.operationType === "mutation", "Parser correctly extracts operationType 'mutation'");
  assert(mutationResult.operationName === "CreateUser", "Parser correctly extracts operationName 'CreateUser'");

  // Test 1.3: Anonymous query rejected
  try {
    parser.parse(`{ products { id name } }`);
    assert(false, "Parser should reject anonymous queries");
  } catch (err: any) {
    assert(err.message === "Every GraphQL operation must be named.", "Anonymous query throws exact error message");
  }

  // Test 1.4: Invalid syntax rejected
  try {
    parser.parse(`query { not valid`);
    assert(false, "Parser should reject invalid syntax");
  } catch (err: any) {
    assert(err.message.includes("Invalid GraphQL query"), "Invalid syntax returns descriptive error");
  }

  // ── 2. Test RequestResolverService ────────────────────────────────────────
  console.log("\n--- Phase 2 & 4: RequestResolverService & Redis Cache Tests ---");
  const opRepo = new MockOperationRepository();
  const svcRepo = new MockGraphQLServiceRepository();
  const polRepo = new MockRoutingPolicyRepository();
  const mockCache = new InMemoryCacheService();

  const resolver = new RequestResolverService(opRepo, polRepo, svcRepo, mockCache);

  // Setup database fixtures
  const dummyService = await svcRepo.create({
    name: "Product Service",
    endpoint: "http://localhost:9999/graphql",
    environment: "production",
    applicationId: "app-1",
  });

  const dummyOperation = await opRepo.create({
    name: "GetProducts",
    type: "QUERY",
    estimatedCost: "LOW",
    cacheable: true,
    requiresDatabase: true,
    priority: "HIGH",
    graphQLServiceId: dummyService.id,
  });

  const dummyPolicy = await polRepo.create({
    operationId: dummyOperation.id,
    preferredRuntime: Runtime.DOCKER,
    cpuThreshold: 80,
    requestThreshold: 1000,
    enabled: true,
  });

  // Test 2.1: Cache Miss on first resolution
  const resolvedMiss = await resolver.resolve("GetProducts");
  assert(resolvedMiss.cacheHit === false, "First resolution is a Cache MISS");
  assert(resolvedMiss.operation.name === "GetProducts", "Resolved operation matches");
  assert(resolvedMiss.graphqlService.name === "Product Service", "Resolved GraphQL service matches");
  assert(resolvedMiss.routingPolicy.preferredRuntime === Runtime.DOCKER, "Resolved routing policy matches");

  // Test 2.2: Cache Hit on second resolution
  const resolvedHit = await resolver.resolve("GetProducts");
  assert(resolvedHit.cacheHit === true, "Second resolution is a Cache HIT");
  assert(resolvedHit.operation.id === dummyOperation.id, "Cached operation ID matches");

  // Test 2.3: Unregistered operation error
  try {
    await resolver.resolve("NonExistentOp");
    assert(false, "Should throw for unregistered operation");
  } catch (err: any) {
    assert(
      err.message === "Operation 'NonExistentOp' is not registered.",
      "Unregistered operation throws exact error: Operation 'NonExistentOp' is not registered."
    );
  }

  // Test 2.4: Missing GraphQL Service error
  const brokenOp = await opRepo.create({
    name: "BrokenServiceOp",
    type: "QUERY",
    estimatedCost: "LOW",
    cacheable: false,
    requiresDatabase: false,
    priority: "MEDIUM",
    graphQLServiceId: "non-existent-service-id",
  });
  await polRepo.create({
    operationId: brokenOp.id,
    preferredRuntime: Runtime.DOCKER,
    cpuThreshold: 80,
    requestThreshold: 1000,
    enabled: true,
  });

  try {
    await resolver.resolve("BrokenServiceOp");
    assert(false, "Should throw for missing GraphQL service");
  } catch (err: any) {
    assert(err.message === "No GraphQL Service found.", "Missing GraphQL service throws exact error: No GraphQL Service found.");
  }

  // ── 3. Test GatewayService & Upstream Forwarding ───────────────────────────
  console.log("\n--- Phase 3, 5, 6, 7, 8: End-to-End Gateway Forwarding & Telemetry Tests ---");

  // Spin up a mock upstream GraphQL server
  let upstreamReceivedBody: any = null;
  let upstreamReceivedHeaders: any = null;

  const mockUpstreamServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      upstreamReceivedHeaders = req.headers;
      upstreamReceivedBody = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          data: {
            products: [
              { id: "p-101", name: "SpikeFlow Sensor" },
              { id: "p-102", name: "High-Speed Gateway" },
            ],
          },
        })
      );
    });
  });

  await new Promise<void>((resolve) => mockUpstreamServer.listen(9999, resolve));

  const metricsService = new MetricsService();
  const decisionEngineService = new DecisionEngineService(opRepo, polRepo, metricsService);
  const runtimeService = new RuntimeService(decisionEngineService);

  const gatewayService = new GatewayService(
    parser,
    resolver,
    decisionEngineService,
    runtimeService
  );

  // Setup Express App with Gateway Router
  const app = express();
  app.use(express.json());
  app.use("/gateway", createGatewayRouter(gatewayService));

  const gatewayServer = http.createServer(app);
  await new Promise<void>((resolve) => gatewayServer.listen(9998, resolve));

  // Test 3.1: Clean GraphQL request without serviceName
  const forwardResponse = await fetch("http://localhost:9998/gateway", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": "test-req-12345",
    },
    body: JSON.stringify({
      query: `
        query GetProducts {
          products {
            id
            name
          }
        }
      `,
      variables: { limit: 10 },
    }),
  });

  assert(forwardResponse.status === 200, "Gateway responds with HTTP 200");
  const responseData: any = await forwardResponse.json();
  assert(
    responseData.data.products[0].name === "SpikeFlow Sensor",
    "Gateway transparently returns upstream response data verbatim"
  );
  assert(upstreamReceivedBody.operationName === "GetProducts", "Upstream received extracted operationName");
  assert(upstreamReceivedBody.variables.limit === 10, "Upstream received forwarded variables");
  assert(upstreamReceivedHeaders["x-request-id"] === "test-req-12345", "Upstream received x-request-id header");

  // Test 3.2: Missing operation name error
  const unnamedResponse = await fetch("http://localhost:9998/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{ products { id } }`,
    }),
  });

  assert(unnamedResponse.status === 400, "Unnamed operation returns HTTP 400");
  const unnamedData: any = await unnamedResponse.json();
  assert(
    unnamedData.errors[0].message === "Every GraphQL operation must be named.",
    "Unnamed operation returns error: Every GraphQL operation must be named."
  );

  // Test 3.3: Unregistered operation error
  const unregisteredResponse = await fetch("http://localhost:9998/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query UnregisteredOp { products { id } }`,
    }),
  });

  assert(unregisteredResponse.status === 404, "Unregistered operation returns HTTP 404");
  const unregisteredData: any = await unregisteredResponse.json();
  assert(
    unregisteredData.errors[0].message === "Operation 'UnregisteredOp' is not registered.",
    "Unregistered operation returns error: Operation 'UnregisteredOp' is not registered."
  );

  // Test 3.4: Empty request body error
  const emptyResponse = await fetch("http://localhost:9998/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(emptyResponse.status === 400, "Empty request body returns HTTP 400");
  const emptyData: any = await emptyResponse.json();
  assert(
    emptyData.errors[0].message === "Every GraphQL operation must be named.",
    "Empty body returns error: Every GraphQL operation must be named."
  );

  // Clean up test servers
  await new Promise((resolve) => mockUpstreamServer.close(resolve));
  await new Promise((resolve) => gatewayServer.close(resolve));

  console.log("\n=======================================================");
  console.log(`🎉 All ${passedTests}/${totalTests} Sprint 20 Tests Passed Successfully!`);
  console.log("=======================================================\n");
}

runSprint20Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
