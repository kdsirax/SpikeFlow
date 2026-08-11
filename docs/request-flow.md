# End-to-End Request Flow & Adaptive Orchestration Pipeline

## 1. Pipeline Overview

Every inbound GraphQL request traversing SpikeFlow undergoes a deterministic, multi-stage execution and orchestration lifecycle designed for low latency, fault isolation, and dynamic compute placement.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. INGRESS & VALIDATION                          │
│ Client Request ──▶ Express Gateway Proxy (/gateway) ──▶ Body/Header Parse   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       2. AST INSPECTION & EXTRACTION                        │
│ Parse AST ──▶ Extract Operation Name & Type ──▶ Validate Named Operation    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    3. METADATA RESOLUTION & FAST-PATH CACHE                 │
│ Check Redis (resolved:<name>) ──▶ Cache HIT / Query DB Hierarchy Fallback  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                      4. HEURISTIC DECISION ENGINE                           │
│ Collect Host CPU/Memory ──▶ Evaluate Routing Policy Thresholds ──▶ Decision │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    5. PLUGGABLE RUNTIME EXECUTION DISPATCH                  │
│ RuntimeExecutorRegistry ──▶ DockerExecutor / ServerlessExecutor ──▶ Forward │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                   6. ASYNC TELEMETRY & CLIENT DESERIALIZATION               │
│ Non-blocking DB History Write ──▶ Structured Pino Telemetry ──▶ JSON Output │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Execution Lifecycle Stages

### Stage 1: Ingress & Validation
- **Endpoint:** `POST http://localhost:4000/gateway` (or `http://localhost/gateway` via Nginx reverse proxy).
- **Transport:** HTTP/1.1 or HTTP/2 POST with `Content-Type: application/json`.
- **Request Identification:** A unique distributed tracing identifier (`x-request-id`) is generated via `crypto.randomUUID()` if not already supplied by the client.
- **Validation:** Verifies JSON payload integrity and ensures `query` is present in the request body.

### Stage 2: Sub-Millisecond AST Inspection
- **Service:** `GraphQLParserService`
- **Compiler:** `graphql/language` parser.
- **Operation Extraction:**
  - Compiles the query string into an AST without schema validation overhead.
  - Extracts the canonical operation name (e.g. `GetProducts`) and operation type (`QUERY` or `MUTATION`).
  - **Constraint Enforcement:** Unnamed/anonymous queries are rejected with an explicit `HTTP 400 Bad Request` ("Every GraphQL operation must be named").

### Stage 3: Metadata Resolution & Redis Fast-Path Caching
- **Service:** `RequestResolverService`
- **Fast-Path (Redis):** Queries Redis key `resolved:<operationName>`.
  - **Cache Hit:** Instantaneous deserialization of the resolved metadata tuple: `{ operation, graphqlService, routingPolicy }`.
  - **Cache Miss:** Queries PostgreSQL via Prisma across the domain hierarchy:
    1. Look up `Operation` by name.
    2. Look up `GraphQLService` by `graphQLServiceId`.
    3. Look up active `RoutingPolicy` by `operationId`.
    4. Store consolidated metadata in Redis with configurable TTL (default 1 hour).

### Stage 4: Heuristic Decision Engine Evaluation
- **Service:** `DecisionEngineService`
- **Telemetry Collection:** Interrogates host hardware telemetry via `MetricsService` (CPU usage percentage and memory percentage).
- **Evaluation Rules:**
  1. If no routing policy is defined or policy is disabled, default to `preferredRuntime` (or `DOCKER`).
  2. If current CPU load exceeds `policy.cpuThreshold` (e.g., $90\% > 80\%$), trigger automated compute offloading and route to `SERVERLESS`.
  3. Otherwise, retain execution on `DOCKER` for low-latency database connection pooling.
- **Output:** Returns a structured `RuntimeDecision` object:
  ```typescript
  {
    runtime: "SERVERLESS",
    reason: "CPU usage (90%) exceeded policy threshold (80%)",
    cpuUsage: 90,
    memoryPercent: 35
  }
  ```

### Stage 5: Pluggable Runtime Execution Dispatch
- **Service:** `RuntimeExecutorService`
- **Registry Delegation:** Locates the registered `RuntimeExecutor` for the chosen runtime string:
  - **`DockerRuntimeExecutor`**: Initiates an HTTP POST stream to the upstream service endpoint (e.g., `http://product-service:5000/graphql`) with forwarded headers (`x-request-id`), query, and variables.
  - **`ServerlessRuntimeExecutor`**: Dispatches the request to an ephemeral cloud execution target (e.g., AWS Lambda, GCP Cloud Functions).
  - **`KubernetesRuntimeExecutor`**: Dynamically dispatches heavy background analytics jobs to Kubernetes worker pods.

### Stage 6: Non-Blocking Telemetry & Response Delivery
- **Precision Latency Measurement:** Execution latency is measured using high-precision `performance.now()`.
- **Fault-Isolated Persistence:** An `ExecutionHistory` record is persisted asynchronously via `ExecutionHistoryService.recordHistorySafely()`.
  - **Zero Blast Radius:** If PostgreSQL connection fails, the error is caught, logged to Pino, and client response delivery continues unimpeded.
- **Structured Telemetry:** Emits structured Pino JSON logs capturing request ID, latency, target URL, cache status, and selected runtime.
- **Response Delivery:** Returns the raw JSON GraphQL response payload and HTTP status code directly to the client consumer.