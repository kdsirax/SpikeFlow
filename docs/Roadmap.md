# SpikeFlow Product & Engineering Roadmap

## Milestone Horizon

### Phase 1: Core Foundation & Domain Modeling (Completed ✅)
- [x] Multi-tenant domain models (`Organization`, `Application`, `GraphQLService`, `Operation`, `RoutingPolicy`).
- [x] Layered Clean Architecture (Schema, Resolver, Service, Repository).
- [x] Constructor Dependency Injection & cross-domain validation.
- [x] Merged executable Apollo GraphQL Server schema.

### Phase 2: Automatic Resolution & Caching (Completed ✅)
- [x] Sub-millisecond AST parser for operation name and type extraction.
- [x] Multi-tiered Redis caching layer (`resolved:<name>`).
- [x] Cache-aside pattern with automatic invalidation on updates/deletes.

### Phase 3: Adaptive Runtime Execution Engine (Completed ✅)
- [x] `RuntimeExecutor` interface abstraction.
- [x] `DockerRuntimeExecutor` with upstream proxying.
- [x] `ServerlessRuntimeExecutor` for burst offloading.
- [x] `RuntimeExecutorService` dynamic registry.
- [x] Heuristic `DecisionEngineService` evaluating live host CPU and memory telemetry.

### Phase 4: Observability & Developer Management (Completed ✅)
- [x] High-precision execution latency logging (`performance.now()`).
- [x] Fault-isolated asynchronous `ExecutionHistory` persistence.
- [x] Full-lifecycle Next.js 16 management dashboard with relationship-aware selectors.
- [x] Execution telemetry charts, timeline graphs, and audit log inspection modal.

---

### Phase 5: Next-Generation Capabilities (Upcoming 🚀)
- [ ] **Distributed Subgraph Query Splitting:** Decompose nested GraphQL queries to execute different fields on different runtimes in parallel.
- [ ] **AWS Lambda & Google Cloud Run Direct SDK Integrations:** Native invocation protocols bypassing HTTP gateway hops.
- [ ] **Predictive Traffic Shaping:** Machine-learning-based surge prediction using rolling traffic windows.
- [ ] **OpenTelemetry & Prometheus Exporter:** Export Prometheus metrics on `/metrics` and OpenTelemetry tracing spans.
