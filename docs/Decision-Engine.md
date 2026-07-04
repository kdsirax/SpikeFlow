# Routing & Decision Engine

The core differentiator of SpikeFlow is its **Intelligent Decision Engine**, which dynamically routes operations to the most appropriate runtime environment (Docker Containers vs. Serverless Functions). 

This document outlines the routing algorithms, rules, and telemetry inputs that drive these decisions.

---

## 1. Decision Inputs

The Decision Engine processes three streams of real-time metadata before deciding where to execute a GraphQL operation:

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│    Operation Metadata     │      │   Service Health State    │      │    Traffic Telemetry      │
├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
│ • Estimated Cost (1-100)  │      │ • Container CPU/Mem       │      │ • Requests/Min (RPM)      │
│ • Database Requirement   │      │ • Container Connection Pool│      │ • Surge Event Flags       │
│ • Preferred Runtime       │      │ • Response Latencies      │      │ • Active Rate Limits      │
└─────────────┬─────────────┘      └─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │                                  │
              └──────────────────────────────────┼──────────────────────────────────┘
                                                 ▼
                                    ┌───────────────────────────┐
                                    │      Decision Engine      │
                                    └────────────┬──────────────┘
                                                 │
                                                 ▼
                                     [ Docker vs. Serverless ]
```

---

## 2. The Routing Algorithm

Routing is determined using a hybrid strategy: a fast **Rule-Based Pass** followed by a **Dynamic Scoring Evaluation** if rules indicate `DYNAMIC` runtime.

### 2.2 Phase 1: Hard Rule Filters
Certain operations bypass dynamic scoring due to functional constraints:
- **Database Dependency:** If an operation writes state (Mutation) and requires high-throughput database transactions, it is pinned to **Docker** to avoid serverless database connection pool exhaustion.
- **Manual Overrides:** Users can set rules like `ALWAYS_SERVERLESS` or `ALWAYS_DOCKER` to lock an operation's destination.

### 2.2 Phase 2: Dynamic Scoring Evaluation
For operations configured with `DYNAMIC` runtimes, a heuristic score is calculated:

$$\text{Routing Score} = (W_{\text{cost}} \times \text{Cost}) + (W_{\text{cpu}} \times \text{CPU}_{\text{Docker}}) + (W_{\text{traffic}} \times \text{TrafficSpike})$$

If the score exceeds a configurable threshold (e.g., $Score \ge 70$), the query is routed to **Serverless** to offload containers.

---

## 3. Dynamic Routing Decision Logic Matrix

| Operation Priority | Database Req. | CPU Load (Docker) | Traffic Spike Status | Destination | Reason for Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High** (Write) | Yes | Any | Normal | **Docker** | Core write transaction with DB pool constraints |
| **Low** (Fuzzy Search)| No | Normal | Normal | **Serverless**| Compute intensive, no DB dependency |
| **Medium** (Reads) | Yes | < 70% | Normal | **Docker** | Within healthy container operating limits |
| **Medium** (Reads) | Yes | **> 70%** | Normal | **Serverless**| Offloaded to Serverless due to Docker container strain |
| **Any** | No | Any | **Spike Detected** | **Serverless**| Failover active: offloading read queries to Lambda |
| **Low** (Metrics) | No | > 85% | Spike Detected | **Dropped** | Rate limit/backoff activated during critical load |

---

## 4. Spike Detection Engine
SpikeFlow tracks throughput on a rolling window. 

```javascript
// Example pseudo-logic inside Gateway Middleware
function detectTrafficSpike(currentRPM, baseRPM) {
  const SPIKE_THRESHOLD = 3.0; // 3x baseline traffic
  return (currentRPM / baseRPM) > SPIKE_THRESHOLD;
}
```

When a spike is detected:
1. The engine enters **Failover Mode**.
2. All non-essential, stateless read queries (e.g. product listings, reports) are forced onto Serverless.
3. Core write transactions (e.g. checkouts) remain on Docker, now protected from search query traffic.

---

## 5. Routing Log and Explanations
To ensure transparency, every decision writes a record back to the database. These records populate the developer dashboard:

```json
{
  "requestId": "req_8817a9bc",
  "operationName": "searchProducts",
  "destination": "SERVERLESS",
  "responseTime": 120,
  "status": "SUCCESS",
  "reason": "DOCKER_CPU_HIGH: Container CPU utilization is at 84%. Query offloaded to Serverless Function.",
  "timestamp": "2026-07-03T13:00:15Z"
}
```
> [!TIP]
> Use the reason codes to refine operation metadata. If an operation runs slowly on Serverless due to cold starts, adjust its priority to lock it to Docker.
