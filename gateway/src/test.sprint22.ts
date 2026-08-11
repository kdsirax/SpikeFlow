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
import { DockerRuntimeExecutor, DockerExecutor } from "./domains/runtime/docker.executor.js";
import { ServerlessRuntimeExecutor, ServerlessExecutor } from "./domains/runtime/serverless.executor.js";
import { RuntimeService } from "./domains/runtime/runtime.service.js";
import type { RuntimeExecutor, ExecutionRequest, ExecutionResult } from "./domains/runtime/runtime.types.js";
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

// ── Mock Metrics Service for Controlled Routing ─────────────────────────────
class MockMetricsService extends MetricsService {
  public mockCpu: number = 20;
  public mockMemoryPercent: number = 30;

  override async getSystemMetrics() {
    return {
      cpuUsage: this.mockCpu,
      memoryUsage: {
        totalMB: 16000,
        usedMB: 4800,
        usagePercent: this.mockMemoryPercent,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// ── Custom Mock Executors for Extensibility Testing ─────────────────────────
class KubernetesRuntimeExecutor implements RuntimeExecutor {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    return {
      runtime: "Kubernetes",
      message: `Executed on K8s pod for operation: ${request.operationName}`,
      data: {
        cluster: "k8s-prod-cluster-1",
        status: "RUNNING",
      },
    };
  }
}

class CloudRunRuntimeExecutor implements RuntimeExecutor {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    return {
      runtime: "CloudRun",
      message: `Executed on Google Cloud Run container for operation: ${request.operationName}`,
      data: {
        service: "cloud-run-worker",
        region: "us-central1",
      },
    };
  }
}

async function runSprint22Tests() {
  console.log("\n=======================================================");
  console.log("🚀 Starting Sprint 22 Runtime Execution Engine Tests");
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

  // ── 1. Mock Upstream GraphQL Server (Docker destination) ──────────────────
  let upstreamCallCount = 0;
  let upstreamReceivedBody: any = null;
  let upstreamReceivedHeaders: any = null;

  const mockUpstreamServer = http.createServer((req, res) => {
    upstreamCallCount++;
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
              { id: "p-201", name: "High-Performance Gateway Node" },
              { id: "p-202", name: "Dynamic Runtime Engine" },
            ],
          },
        })
      );
    });
  });

  await new Promise<void>((resolve) => mockUpstreamServer.listen(9876, resolve));

  // ── 2. Test Direct Executors (DockerRuntimeExecutor & ServerlessRuntimeExecutor)
  console.log("\n--- Phase 1 & 2: Unit Testing Individual Runtime Executors ---");

  const dockerExecutor = new DockerRuntimeExecutor();
  const serverlessExecutor = new ServerlessRuntimeExecutor();

  // Test 1.1: Docker executor sends HTTP POST to upstream
  const dockerResult = await dockerExecutor.execute({
    query: "query GetProducts { products { id name } }",
    operationName: "GetProducts",
    requestId: "req-docker-1",
    targetUrl: "http://localhost:9876/graphql",
    variables: { page: 1 },
  });
  assert(
    (dockerResult.data as any)?.products[0]?.name === "High-Performance Gateway Node",
    "DockerRuntimeExecutor forwards to upstream and returns data"
  );
  assert(upstreamReceivedHeaders["x-request-id"] === "req-docker-1", "Docker executor sends x-request-id header");
  assert(upstreamReceivedBody.operationName === "GetProducts", "Docker executor sends operationName");
  assert(upstreamReceivedBody.variables.page === 1, "Docker executor sends variables");

  // Test 1.2: Serverless executor returns mock response without upstream network call
  const upstreamCountBefore = upstreamCallCount;
  const serverlessResult = await serverlessExecutor.execute({
    query: "query GetProducts { products { id name } }",
    operationName: "GetProducts",
    requestId: "req-sls-1",
  });
  assert(
    serverlessResult.runtime === "Serverless" &&
    serverlessResult.message === "Mock execution" &&
    (serverlessResult.data as any)?.runtime === "Serverless",
    "ServerlessRuntimeExecutor returns mock execution response"
  );
  assert(
    upstreamCallCount === upstreamCountBefore,
    "ServerlessRuntimeExecutor does not make network calls to upstream"
  );

  // ── 3. Test RuntimeExecutorService & Registry Pattern ──────────────────────
  console.log("\n--- Phase 3: Testing RuntimeExecutorService & Registry ---");
  const runtimeExecutorService = new RuntimeExecutorService(dockerExecutor, serverlessExecutor);

  // Test 3.1: execute with Docker runtime decision
  const execDocker = await runtimeExecutorService.execute({
    query: "query GetProducts { products { id name } }",
    operationName: "GetProducts",
    targetUrl: "http://localhost:9876/graphql",
    decision: {
      runtime: Runtime.DOCKER,
      reason: "CPU below threshold",
    },
  });
  assert(
    (execDocker.data as any)?.products?.length === 2,
    "RuntimeExecutorService delegates to Docker executor when decision is DOCKER"
  );

  // Test 3.2: execute with Serverless runtime decision
  const execSls = await runtimeExecutorService.execute({
    query: "query GetProducts { products { id name } }",
    operationName: "GetProducts",
    decision: {
      runtime: Runtime.SERVERLESS,
      reason: "CPU threshold exceeded (85%)",
    },
  });
  assert(
    execSls.runtime === "Serverless" && execSls.message === "Mock execution",
    "RuntimeExecutorService delegates to Serverless executor when decision is SERVERLESS"
  );

  // Test 3.3: direct forwardToDocker and forwardToServerless helpers
  const directDocker = await runtimeExecutorService.forwardToDocker({
    query: "query GetProducts { products { id } }",
    targetUrl: "http://localhost:9876/graphql",
  });
  assert((directDocker.data as any)?.products !== undefined, "forwardToDocker() helper works properly");

  const directSls = await runtimeExecutorService.forwardToServerless({
    query: "query GetProducts { products { id } }",
  });
  assert(directSls.runtime === "Serverless", "forwardToServerless() helper works properly");

  // ── 4. Test Future-Proofing / Extensibility (Custom Executors) ─────────────
  console.log("\n--- Phase 4: Future-Proofing & Pluggable Executors (K8s & CloudRun) ---");

  // Register Kubernetes executor
  runtimeExecutorService.registerExecutor("KUBERNETES", new KubernetesRuntimeExecutor());
  assert(runtimeExecutorService.hasExecutor("KUBERNETES"), "hasExecutor returns true for registered K8s executor");

  const k8sResult = await runtimeExecutorService.execute({
    query: "query HeavyJob { compute }",
    operationName: "HeavyJob",
    decision: {
      runtime: "KUBERNETES" as any,
      reason: "Batch compute workload",
    },
  });
  assert(
    k8sResult.runtime === "Kubernetes" && (k8sResult.data as any)?.cluster === "k8s-prod-cluster-1",
    "Custom KubernetesRuntimeExecutor dynamically executed via registry"
  );

  // Register CloudRun executor
  runtimeExecutorService.registerExecutor("CLOUDRUN", new CloudRunRuntimeExecutor());
  const cloudRunResult = await runtimeExecutorService.execute({
    query: "query ImageProcess { process }",
    operationName: "ImageProcess",
    decision: {
      runtime: "CLOUDRUN" as any,
      reason: "Containerized background task",
    },
  });
  assert(
    cloudRunResult.runtime === "CloudRun" && (cloudRunResult.data as any)?.region === "us-central1",
    "Custom CloudRunRuntimeExecutor dynamically executed via registry"
  );

  // ── 5. Test End-to-End Decision Engine + Gateway Integration ──────────────
  console.log("\n--- Phase 5: End-to-End Gateway + DecisionEngine + Runtime Execution ---");

  const opRepo = new MockOperationRepository();
  const svcRepo = new MockGraphQLServiceRepository();
  const polRepo = new MockRoutingPolicyRepository();
  const mockCache = new InMemoryCacheService();
  const mockMetrics = new MockMetricsService();

  const dummyService = await svcRepo.create({
    name: "Catalog Service",
    endpoint: "http://localhost:9876/graphql",
    environment: "production",
    applicationId: "app-catalog-1",
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

  // Policy: threshold is 70% CPU
  await polRepo.create({
    operationId: dummyOperation.id,
    preferredRuntime: Runtime.DOCKER,
    cpuThreshold: 70,
    requestThreshold: 80,
    enabled: true,
  });

  const parser = new GraphQLParserService();
  const resolver = new RequestResolverService(opRepo, polRepo, svcRepo, mockCache);
  const decisionEngineService = new DecisionEngineService(opRepo, polRepo, mockMetrics);

  const gatewayService = new GatewayService(
    parser,
    resolver,
    decisionEngineService,
    runtimeExecutorService
  );

  const app = express();
  app.use(express.json());
  app.use("/gateway", createGatewayRouter(gatewayService));

  const gatewayServer = http.createServer(app);
  await new Promise<void>((resolve) => gatewayServer.listen(9875, resolve));

  // Test 5.1: Low CPU (20% <= 70%) -> Routes to Docker -> Returns upstream response
  mockMetrics.mockCpu = 20;
  const dockerReqResponse = await fetch("http://localhost:9875/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  assert(dockerReqResponse.status === 200, "Gateway responds 200 for Docker route");
  const dockerBody: any = await dockerReqResponse.json();
  assert(
    dockerBody.data.products[0].name === "High-Performance Gateway Node",
    "Decision Engine low CPU routes to Docker and returns upstream products verbatim"
  );

  // Test 5.2: High CPU (85% > 70%) -> Routes to Serverless -> Returns Mock Serverless Execution
  mockMetrics.mockCpu = 85;
  const slsReqResponse = await fetch("http://localhost:9875/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query GetProducts { products { id name } }",
    }),
  });

  assert(slsReqResponse.status === 200, "Gateway responds 200 for Serverless route");
  const slsBody: any = await slsReqResponse.json();
  assert(
    slsBody.runtime === "Serverless" || slsBody.data?.runtime === "Serverless",
    "Decision Engine high CPU (85% > 70%) routes to Serverless mock execution"
  );
  assert(
    slsBody.message === "Mock execution" || slsBody.data?.message === "Mock execution",
    "Serverless response contains 'Mock execution' message"
  );

  // Test 5.3: Gateway with custom registered executor (e.g. K8s preferred)
  const k8sOperation = await opRepo.create({
    name: "RunBatchCompute",
    type: "QUERY",
    estimatedCost: "HIGH",
    cacheable: false,
    requiresDatabase: false,
    priority: "LOW",
    graphQLServiceId: dummyService.id,
  });

  await polRepo.create({
    operationId: k8sOperation.id,
    preferredRuntime: "KUBERNETES" as any,
    cpuThreshold: 90,
    requestThreshold: 90,
    enabled: false, // Disabled policy defaults to preferredRuntime
  });

  const k8sReqResponse = await fetch("http://localhost:9875/gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "query RunBatchCompute { compute }",
    }),
  });

  assert(k8sReqResponse.status === 200, "Gateway responds 200 for Custom K8s route");
  const k8sBody: any = await k8sReqResponse.json();
  assert(
    k8sBody.runtime === "Kubernetes" && k8sBody.data?.cluster === "k8s-prod-cluster-1",
    "Gateway seamlessly executed custom Kubernetes executor without changes to GatewayService"
  );

  // Clean up test servers
  await new Promise((resolve) => mockUpstreamServer.close(resolve));
  await new Promise((resolve) => gatewayServer.close(resolve));

  console.log("\n=======================================================");
  console.log(`🎉 All ${passedTests}/${totalTests} Sprint 22 Tests Passed Successfully!`);
  console.log("=======================================================\n");
}

runSprint22Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
