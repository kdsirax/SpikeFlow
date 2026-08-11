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
import { RuntimeExecutorService } from "./domains/runtime/runtime-executor.service.js";
import { DockerRuntimeExecutor } from "./domains/runtime/docker.executor.js";
import { ServerlessRuntimeExecutor } from "./domains/runtime/serverless.executor.js";
import { ExecutionHistoryService } from "./domains/execution-history/execution-history.service.js";
import type { IExecutionHistoryRepository } from "./domains/execution-history/execution-history.repository.js";
import type { ExecutionHistory, CreateExecutionHistoryInput } from "./domains/execution-history/execution-history.types.js";
import { MetricsService } from "./domains/metrics/metrics.service.js";
import { CacheService } from "./shared/cache/cache.service.js";
import { Runtime } from "./domains/routing-policy/routing-policy.types.js";
import type { IOperationRepository } from "./domains/operation/operation.repository.js";
import type { IGraphQLServiceRepository } from "./domains/graphql-service/graphql-service.repository.js";
import type { IRoutingPolicyRepository } from "./domains/routing-policy/routing-policy.repository.js";
import type { Operation } from "./domains/operation/operation.types.js";
import type { GraphQLService } from "./domains/graphql-service/graphql-service.types.js";
import type { RoutingPolicy } from "./domains/routing-policy/routing-policy.types.js";

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

class MockExecutionHistoryRepository implements IExecutionHistoryRepository {
  public records: ExecutionHistory[] = [];
  public shouldFail: boolean = false;

  async create(data: CreateExecutionHistoryInput): Promise<ExecutionHistory> {
    if (this.shouldFail) {
      throw new Error("Simulated database write failure during history persistence");
    }
    const record: ExecutionHistory = {
      id: "exec-" + Math.random().toString(36).substring(7),
      operationId: data.operationId,
      runtimeChosen: data.runtimeChosen,
      decisionReason: data.decisionReason ?? null,
      cpuUsage: data.cpuUsage ?? null,
      memoryUsage: data.memoryUsage ?? null,
      cacheHit: data.cacheHit,
      responseTime: data.responseTime,
      status: data.status,
      createdAt: new Date().toISOString(),
    };
    this.records.push(record);
    return record;
  }

  async findAll(): Promise<ExecutionHistory[]> {
    return [...this.records].reverse();
  }

  async findById(id: string): Promise<ExecutionHistory | null> {
    return this.records.find((r) => r.id === id) || null;
  }

  async findByOperationId(operationId: string): Promise<ExecutionHistory[]> {
    return this.records.filter((r) => r.operationId === operationId).reverse();
  }
}

class MockMetricsService extends MetricsService {
  public mockCpu: number = 25;
  public mockMemoryPercent: number = 35;

  override async getSystemMetrics() {
    return {
      cpuUsage: this.mockCpu,
      memoryUsage: {
        totalMB: 16000,
        usedMB: 5600,
        usagePercent: this.mockMemoryPercent,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

async function runSprint23Tests() {
  console.log("\n=======================================================");
  console.log("🚀 Starting Sprint 23 Execution Observability Tests");
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

  // ── Setup Mock Upstream GraphQL Server ────────────────────────────────────
  let upstreamShouldFail = false;

  const mockUpstreamServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (upstreamShouldFail) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: "Internal Upstream Error" }] }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          data: {
            products: [
              { id: "p-301", name: "Observability Sensor" },
              { id: "p-302", name: "Telemetry Node" },
            ],
          },
        })
      );
    });
  });

  await new Promise<void>((resolve) => mockUpstreamServer.listen(9776, resolve));

  // ── Setup Domain Repositories & Services ──────────────────────────────────
  const opRepo = new MockOperationRepository();
  const svcRepo = new MockGraphQLServiceRepository();
  const polRepo = new MockRoutingPolicyRepository();
  const execRepo = new MockExecutionHistoryRepository();
  const mockCache = new InMemoryCacheService();
  const mockMetrics = new MockMetricsService();

  const dummyService = await svcRepo.create({
    name: "Observability Product Service",
    endpoint: "http://localhost:9776/graphql",
    environment: "production",
    applicationId: "app-obs-1",
  });

  const productOperation = await opRepo.create({
    name: "GetProducts",
    type: "QUERY",
    estimatedCost: "LOW",
    cacheable: true,
    requiresDatabase: true,
    priority: "HIGH",
    graphQLServiceId: dummyService.id,
  });

  await polRepo.create({
    operationId: productOperation.id,
    preferredRuntime: Runtime.DOCKER,
    cpuThreshold: 80,
    requestThreshold: 80,
    enabled: true,
  });

  const categoryOperation = await opRepo.create({
    name: "GetCategories",
    type: "QUERY",
    estimatedCost: "LOW",
    cacheable: true,
    requiresDatabase: false,
    priority: "MEDIUM",
    graphQLServiceId: dummyService.id,
  });

  await polRepo.create({
    operationId: categoryOperation.id,
    preferredRuntime: Runtime.DOCKER,
    cpuThreshold: 80,
    requestThreshold: 80,
    enabled: true,
  });

  const parser = new GraphQLParserService();
  const resolver = new RequestResolverService(opRepo, polRepo, svcRepo, mockCache);
  const decisionEngineService = new DecisionEngineService(opRepo, polRepo, mockMetrics);
  const runtimeExecutorService = new RuntimeExecutorService(
    new DockerRuntimeExecutor(),
    new ServerlessRuntimeExecutor()
  );
  const executionHistoryService = new ExecutionHistoryService(execRepo);

  const gatewayService = new GatewayService(
    parser,
    resolver,
    decisionEngineService,
    runtimeExecutorService,
    executionHistoryService
  );

  const app = express();
  app.use(express.json());
  app.use("/gateway", createGatewayRouter(gatewayService));

  const gatewayServer = http.createServer(app);
  await new Promise<void>((resolve) => gatewayServer.listen(9775, resolve));

  // ── TEST 1: Successful Request creates ExecutionHistory Record ────────────
  console.log("\n--- Test 1: Successful Request creates ExecutionHistory ---");
  mockMetrics.mockCpu = 25;
  mockMetrics.mockMemoryPercent = 35;

  const req1 = await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  assert(req1.status === 200, "Gateway responds with HTTP 200");
  const body1: any = await req1.json();
  assert(body1.data.products[0].name === "Observability Sensor", "Response data matches upstream");

  // Verify Execution History was created
  const historyList1 = await executionHistoryService.getExecutionHistory();
  assert(historyList1.length === 1, "Exactly 1 execution history record recorded");

  const record1 = historyList1[0]!;
  assert(record1.operationId === productOperation.id, "Recorded correct operationId");
  assert(record1.runtimeChosen === "DOCKER", "Recorded runtimeChosen as DOCKER");
  assert(record1.status === "SUCCESS", "Recorded status as SUCCESS");
  assert(typeof record1.responseTime === "number" && record1.responseTime >= 0, "Recorded numeric responseTime in ms");
  assert(record1.cpuUsage === 25, "Recorded correct cpuUsage");
  assert(record1.memoryUsage === 35, "Recorded correct memoryUsage");
  assert(typeof record1.cacheHit === "boolean", "Recorded cacheHit boolean");
  assert(record1.decisionReason !== null && record1.decisionReason !== undefined, "Recorded decisionReason");

  // ── TEST 2: Multiple Requests increase history count ──────────────────────
  console.log("\n--- Test 2: Multiple Requests with distinct IDs & Latencies ---");
  await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  const historyList2 = await executionHistoryService.getExecutionHistory();
  assert(historyList2.length === 3, "Execution history count increased to 3");
  assert(historyList2[0]!.id !== historyList2[1]!.id, "History records have unique IDs");
  assert(historyList2[0]!.createdAt !== undefined, "History record has createdAt timestamp");

  // ── TEST 3: Different Operations Filtered by Operation ID ─────────────────
  console.log("\n--- Test 3: History by Operation & by ID ---");
  await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetCategories { categories { id } }",
    }),
  });

  const productHistories = await executionHistoryService.getExecutionHistoryByOperation(productOperation.id);
  const categoryHistories = await executionHistoryService.getExecutionHistoryByOperation(categoryOperation.id);

  assert(productHistories.length === 3, "executionHistoryByOperation returns only 3 GetProducts records");
  assert(categoryHistories.length === 1, "executionHistoryByOperation returns only 1 GetCategories record");
  assert(categoryHistories[0]!.operationId === categoryOperation.id, "Category history matches category operationId");

  const singleRecord = await executionHistoryService.getExecutionById(record1.id);
  assert(singleRecord !== null && singleRecord!.id === record1.id, "getExecutionById retrieves single record");

  // ── TEST 4: Failed Request captures status = FAILED ───────────────────────
  console.log("\n--- Test 4: Failed Execution records status = FAILED ---");
  upstreamShouldFail = true;

  const failedReq = await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  assert(failedReq.status === 500, "Gateway returns HTTP 500 for upstream failure");
  const failedHistories = await executionHistoryService.getExecutionHistory();
  const latestFailed = failedHistories[0]!;
  assert(latestFailed.status === "FAILED", "ExecutionHistory captured status = FAILED for failed execution");
  assert(latestFailed.operationId === productOperation.id, "Captured operationId for failed execution");

  upstreamShouldFail = false; // reset

  // ── TEST 5: Observability Failure does NOT break Gateway response ──────────
  console.log("\n--- Test 5: Observability Resilience (DB write failure) ---");
  execRepo.shouldFail = true; // Simulate database error during history recording

  const resilientReq = await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  assert(resilientReq.status === 200, "Gateway STILL responds HTTP 200 even when DB history write fails");
  const resilientBody: any = await resilientReq.json();
  assert(
    resilientBody.data.products[0].name === "Observability Sensor",
    "Client receives complete GraphQL data verbatim during observability outage"
  );

  execRepo.shouldFail = false; // restore normal operation

  // ── TEST 6: High CPU Serverless Execution History ─────────────────────────
  console.log("\n--- Test 6: Serverless Decision Execution History ---");
  mockMetrics.mockCpu = 92; // Exceeds 80% threshold

  const slsReq = await fetch("http://localhost:9775/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  assert(slsReq.status === 200, "Serverless request responds HTTP 200");
  const slsHistories = await executionHistoryService.getExecutionHistory();
  const slsRecord = slsHistories[0]!;
  assert(slsRecord.runtimeChosen === "SERVERLESS", "ExecutionHistory recorded runtimeChosen = SERVERLESS");
  assert(slsRecord.cpuUsage === 92, "ExecutionHistory recorded cpuUsage = 92%");
  assert(slsRecord.status === "SUCCESS", "ExecutionHistory recorded status = SUCCESS");

  // Clean up test servers
  await new Promise((resolve) => mockUpstreamServer.close(resolve));
  await new Promise((resolve) => gatewayServer.close(resolve));

  console.log("\n=======================================================");
  console.log(`🎉 All ${passedTests}/${totalTests} Sprint 23 Tests Passed Successfully!`);
  console.log("=======================================================\n");
}

runSprint23Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
