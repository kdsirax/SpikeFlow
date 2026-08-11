# SpikeFlow Intelligent Decision Engine & Heuristic Matrix

## 1. Engine Objective

The **SpikeFlow Decision Engine** serves as the dynamic brains of the execution layer. It continuously synthesizes multidimensional inputs—operation complexity, database affinity, real-time hardware telemetry, and declarative routing policies—to orchestrate GraphQL query execution across heterogeneous compute targets.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DECISION INPUT VECTORS                            │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│    Operation Complexity      │     Hardware Telemetry       │ Routing Policy│
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ • Estimated Cost (LOW/MED/HI)│ • CPU Utilization (%)        │ • Preferred   │
│ • Database Affinity (Boolean)│ • Memory Utilization (%)     │ • CPU Limit   │
│ • Priority Level (LOW/MED/HI)│ • Request Velocity (RPM)     │ • Req Limit   │
│ • Cacheability Flag          │ • Host Thermal/Load Average  │ • Active Flag │
└──────────────────────────────┴──────────────────────────────┴───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │    DecisionEngineService      │
                       │ (Heuristic Evaluation Matrix) │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │       RuntimeDecision         │
                       │ • Target Runtime (DOCKER/FaaS)│
                       │ • Diagnostic Explanation      │
                       │ • Instantaneous Telemetry     │
                       └───────────────────────────────┘
```

---

## 2. Dynamic Evaluation Algorithm

The evaluation sequence proceeds through two rigorous algorithmic phases:

### Phase 1: Policy & State Feasibility Check
1. **Disabled Policy Fallback:** If the operation lacks a policy or `enabled === false`, the engine immediately defaults to `preferredRuntime` (or `DOCKER`) with the reason:
   $$\text{Reason: "Routing policy is disabled; defaulting to preferred runtime"}$$
2. **Stateful Database Pinning:** Mutations and transactional queries requiring relational database connection pool affinity are prioritized on containerized environments to prevent serverless connection starvation.

### Phase 2: Telemetry Threshold Comparison
1. Interrogates instantaneous host CPU load percentage: $CPU_{\text{current}}$.
2. Compares against the user-configured policy threshold: $CPU_{\text{threshold}}$.
3. **Threshold Breach (Failover Trigger):**
   $$\text{If } CPU_{\text{current}} > CPU_{\text{threshold}} \implies \text{Runtime} = \text{SERVERLESS}$$
   $$\text{Reason: "CPU usage } (CPU_{\text{current}}\%) \text{ exceeded policy threshold } (CPU_{\text{threshold}}\%)"$$
4. **Nominal State (Baseline Execution):**
   $$\text{If } CPU_{\text{current}} \le CPU_{\text{threshold}} \implies \text{Runtime} = \text{preferredRuntime}$$
   $$\text{Reason: "Metrics within thresholds — CPU } CPU_{\text{current}}\%, \text{ Memory } Mem_{\text{current}}\%"$$

---

## 3. Comprehensive Decision Matrix

| Operation Type | Cost | DB Affinity | Priority | Host CPU | Policy Status | Orchestration Target | Telemetry Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MUTATION` | `HIGH` | `true` | `HIGH` | $25\%$ | Active | **Docker** | Core write transaction pinned to maintain DB connection pool |
| `MUTATION` | `HIGH` | `true` | `HIGH` | $92\%$ | Active | **Docker** | Core write transaction preserved on container despite high CPU |
| `QUERY` | `LOW` | `true` | `MEDIUM` | $35\%$ | Active ($\le 80\%$) | **Docker** | Metrics within thresholds — CPU 35%, Memory 40% |
| `QUERY` | `LOW` | `true` | `MEDIUM` | $88\%$ | Active ($> 80\%$) | **Serverless** | CPU usage (88%) exceeded policy threshold (80%) |
| `QUERY` | `HIGH` | `false` | `LOW` | Any | Serverless Pref. | **Serverless** | High-compute stateless query dispatched to auto-scaling FaaS |
| `QUERY` | `MEDIUM`| `true` | `MEDIUM` | $85\%$ | Disabled | **Docker** | Routing policy is disabled; defaulting to preferred runtime |

---

## 4. Structured Output Contract

The decision engine produces a strongly-typed `RuntimeDecision` contract returned to the gateway orchestration pipeline:

```typescript
export interface RuntimeDecision {
  runtime: Runtime | string;
  reason: string;
  cpuUsage: number;
  memoryPercent: number;
}
```

This diagnostic record is persisted directly into the `ExecutionHistory` table and rendered in the Developer Management Dashboard to provide full transparency into routing decisions.
