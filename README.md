<div align="center">

# ⚡ SpikeFlow

**An Intelligent Execution & Adaptive Orchestration Layer for GraphQL**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
[![Apollo GraphQL](https://img.shields.io/badge/Apollo%20GraphQL-Server-311C87.svg)](https://www.apollographql.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.x-2D3748.svg)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20Layer-DC382D.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

*Optimize runtime compute dispatch, eliminate traffic bottlenecks, and orchestrate hybrid GraphQL workloads across containerized and serverless infrastructure using real-time telemetry and configurable routing policies.*

</div>

---

## 📖 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Architectural Pillars](#-key-architectural-pillars)
- [System Topology](#-system-topology)
- [Domain Entity Hierarchy](#-domain-entity-hierarchy)
- [Heuristics & Decision Engine](#-heuristics--decision-engine)
- [Pluggable Runtime Execution Engine](#-pluggable-runtime-execution-engine)
- [Execution Observability & Telemetry](#-execution-observability--telemetry)
- [Developer Management Dashboard](#-developer-management-dashboard)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker Compose](#running-with-docker-compose-recommended)
  - [Local Development Setup](#local-development-setup)
- [GraphQL Management API Reference](#-graphql-management-api-reference)
- [End-to-End Verification Workflow](#-end-to-end-verification-workflow)
- [Project Structure](#-project-structure)

---

## 🏛️ Architectural Overview

Modern GraphQL architectures typically force engineering teams into an architectural compromise: deploy exclusively on **stateful container clusters** (which risk CPU saturation during traffic spikes and incur high idle costs) or deploy entirely on **serverless functions** (which suffer from cold starts, execution timeouts, and connection pool exhaustion on transactional databases).

**SpikeFlow resolves this dilemma through adaptive runtime orchestration.** 

Sitting transparently between client consumers and upstream GraphQL services, SpikeFlow inspects every incoming GraphQL document via AST extraction, correlates operation cost and priority heuristics with live system resource telemetry (CPU, Memory, Request Velocity), and dynamically orchestrates execution to the optimal compute runtime—whether long-running Docker containers, auto-scaling Serverless functions, or custom Kubernetes workloads.

```
                                  INCOMING GRAPHQL TRAFFIC
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │    SpikeFlow Gateway Proxy    │
                             │        (Port 4000/gateway)    │
                             └───────────────┬───────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             AST Document Parser                         Redis Fast-Path Cache
         (Extracts Op Name & Type)                   (Cached Metadata Resolution)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │  Intelligent Decision Engine  │
                             │   (Evaluates CPU/Mem & Policy)│
                             └───────────────┬───────────────┘
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     ▼                                               ▼
     ┌───────────────────────────────┐               ┌───────────────────────────────┐
     │     DockerRuntimeExecutor     │               │   ServerlessRuntimeExecutor   │
     │  (Stateful / Low-Latency DB)  │               │   (Auto-Scaling Surge FaaS)   │
     └───────────────┬───────────────┘               └───────────────┬───────────────┘
                     │                                               │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │ Non-Blocking Telemetry Logger │
                             │  (ExecutionHistory in Postgres│
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                                  CLIENT RESPONSE PAYLOAD
```

---

## 🌟 Key Architectural Pillars

### 1. Sub-Millisecond AST Inspection & Automatic Operation Resolution
Every incoming GraphQL request is parsed via the `graphql/language` AST parser to extract the canonical operation name and operation type without executing the query body. Metadata lookups are accelerated through a multi-tiered Redis caching layer, falling back to PostgreSQL only upon cache misses.

### 2. Heuristic-Driven Dynamic Routing
Routing decisions are governed by a configurable decision matrix that synthesizes:
- **Operation Priority & Cost:** `LOW`, `MEDIUM`, `HIGH` complexity heuristics.
- **Database Affinity:** Flags operations requiring direct relational connection pools.
- **Live System Telemetry:** Real-time CPU and memory metrics captured by the host telemetry subsystem.
- **Threshold Policies:** User-defined CPU and request velocity thresholds that trigger automatic serverless offloading during compute surges.

### 3. Pluggable Runtime Executor Pattern
The gateway core is decoupled from transport and execution mechanics. Concrete executors implement the `RuntimeExecutor` interface (`DockerRuntimeExecutor`, `ServerlessRuntimeExecutor`, `KubernetesRuntimeExecutor`), registered into a central `RuntimeExecutorService` registry.

### 4. Non-Blocking Observability & Telemetry Isolation
Observability is resilient by design: failures in metrics capture, telemetry streaming, or database logging are completely isolated and guaranteed to **never fail a client GraphQL response**. Latency is captured with microsecond precision using `performance.now()`.

### 5. Multi-Tenant Resource Governance
Complete relationship-aware domain modeling enforcing tenant separation:
$$\text{Organization} \longrightarrow \text{Application} \longrightarrow \text{GraphQLService} \longrightarrow \text{Operation} \longrightarrow \text{RoutingPolicy}$$

---

## 🌐 System Topology

| Container / Service | Port | Purpose | Technology Stack |
| :--- | :--- | :--- | :--- |
| **`spikeflow`** | `4000` | Management API (`/graphql`) & Gateway Proxy (`/gateway`) | Node.js 22, Express, Apollo Server, Prisma ORM, Pino |
| **`spikeflow-frontend`** | `3000` | Developer Management & Telemetry Dashboard | Next.js 16 (App Router), Tailwind CSS, Recharts, Lucide |
| **`product-service`** | `5000` | Sample Upstream GraphQL Microservice | Node.js, Express, Apollo Server, PostgreSQL |
| **`spikeflow-nginx`** | `80` | Edge Reverse Proxy & Rate Limiting | NGINX Alpine |
| **`spikeflow-postgres`**| `5432` | Relational Entity & Telemetry Store | PostgreSQL 17 |
| **`spikeflow-redis`** | `6379` | Metadata & Resolved Query Fast-Path Cache | Redis 8 Alpine |

---

## 📊 Domain Entity Hierarchy

SpikeFlow structures infrastructure resources hierarchically to ensure multi-tenant governance and dependency integrity:

```mermaid
erDiagram
    ORGANIZATION ||--o{ APPLICATION : provisions
    APPLICATION ||--o{ GRAPHQL_SERVICE : registers
    GRAPHQL_SERVICE ||--o{ OPERATION : exposes
    OPERATION ||--o| ROUTING_POLICY : configures
    OPERATION ||--o{ EXECUTION_HISTORY : records

    ORGANIZATION {
        string id PK
        string name
        string slug UK
        datetime createdAt
    }

    APPLICATION {
        string id PK
        string organizationId FK
        string name
        string description
    }

    GRAPHQL_SERVICE {
        string id PK
        string applicationId FK
        string name
        string endpoint
        string environment
    }

    OPERATION {
        string id PK
        string graphQLServiceId FK
        string name
        enum type "QUERY | MUTATION"
        enum estimatedCost "LOW | MEDIUM | HIGH"
        enum priority "LOW | MEDIUM | HIGH"
        boolean cacheable
        boolean requiresDatabase
    }

    ROUTING_POLICY {
        string id PK
        string operationId FK, UK
        enum preferredRuntime "DOCKER | SERVERLESS"
        float cpuThreshold
        int requestThreshold
        boolean enabled
    }

    EXECUTION_HISTORY {
        string id PK
        string operationId FK
        string runtimeChosen
        string decisionReason
        float cpuUsage
        float memoryUsage
        boolean cacheHit
        int responseTime
        string status
        datetime createdAt
    }
```

---

## 🧠 Heuristics & Decision Engine

The `DecisionEngineService` evaluates runtime placement according to the following algorithm:

```typescript
// Conceptual Decision Engine Matrix
if (!policy || !policy.enabled) {
  return { runtime: policy?.preferredRuntime ?? Runtime.DOCKER, reason: "Default baseline runtime" };
}

if (currentMetrics.cpuUsage > policy.cpuThreshold) {
  return {
    runtime: Runtime.SERVERLESS,
    reason: `CPU usage (${currentMetrics.cpuUsage}%) exceeded policy threshold (${policy.cpuThreshold}%)`
  };
}

return {
  runtime: policy.preferredRuntime,
  reason: `Metrics within thresholds — CPU ${currentMetrics.cpuUsage}%, Memory ${currentMetrics.memoryPercent}%`
};
```

### Routing Decision Matrix

| Operation Priority | DB Affinity | CPU Utilization | Policy Status | Selected Runtime | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **High / Mutation** | Required | Any | Any | **Docker** | Dedicated container maintains transactional connection pool |
| **Medium / Query** | Required | $\le$ Threshold | Active | **Docker** | System within nominal parameters |
| **Medium / Query** | Required | **$>$ Threshold** | Active | **Serverless** | Compute offloaded to prevent host thread-pool starvation |
| **Low / Query** | Optional | Any | Serverless Preferred | **Serverless** | Stateless surge execution |

---

## 🔌 Pluggable Runtime Execution Engine

Runtime execution is abstracted through the `RuntimeExecutor` contract:

```typescript
export interface RuntimeExecutor {
  readonly runtime: Runtime | string;
  execute(request: ForwardRequest): Promise<ForwardResponse>;
}
```

To introduce a new compute target (e.g., Google Cloud Run, AWS Lambda, or Kubernetes Jobs), implement the interface and register it with the service without modifying the gateway routing pipeline:

```typescript
runtimeExecutorService.registerExecutor(new KubernetesRuntimeExecutor());
```

---

## 📈 Execution Observability & Telemetry

Every request forwarded through SpikeFlow produces an immutable `ExecutionHistory` record capturing:
- **Execution UUID & Operation ID**
- **Selected Runtime & Decision Engine Reason**
- **Hardware Telemetry (Host CPU% and Memory%)**
- **Redis Cache Hit / Miss Status**
- **Execution Response Time (Latency in ms)**
- **HTTP & GraphQL Execution Status (`SUCCESS` / `FAILED`)**
- **ISO Timestamps for Chronological Time-Series Analysis**

---

## 🖥️ Developer Management Dashboard

The Next.js 16 management frontend provides full lifecycle governance and live observability:

- **Dashboard Overview (`/dashboard`)**: Key performance metrics, proportional runtime distribution charts, response time timeline graphs, and real-time execution logs.
- **Organizations (`/organizations`)**: Root multi-tenant provisioning with slug generation.
- **Applications (`/applications`)**: Application workload registry with parent organization selectors.
- **GraphQL Services (`/services`)**: Upstream microservice endpoint registration and environment toggling.
- **Operations (`/operations`)**: AST operation registry with cost, priority, and Redis cache configuration.
- **Routing Policies (`/routing-policies`)**: Dynamic runtime threshold configuration.
- **Executions Explorer (`/dashboard/executions`)**: Searchable, filterable audit log with a detailed diagnostic modal.

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) v20+ (for local development)
- [PostgreSQL](https://www.postgresql.org/) v16+ (for local development)
- [Redis](https://redis.io/) v7+ (for local development)

---

### Running with Docker Compose (Recommended)

To build and start all 6 services with a single command:

```bash
# 1. Clone repository
git clone https://github.com/kdsirax/SpikeFlow.git
cd SpikeFlow

# 2. Build and launch containers
docker compose up --build
```

#### Access Points:
- **SpikeFlow Dashboard**: [http://localhost:3000](http://localhost:3000)
- **GraphQL Management API**: [http://localhost:4000/graphql](http://localhost:4000/graphql)
- **Gateway Forwarding Endpoint**: [http://localhost:4000/gateway](http://localhost:4000/gateway)
- **Nginx Edge Proxy**: [http://localhost:80](http://localhost:80)
- **Sample Product Microservice**: [http://localhost:5000/graphql](http://localhost:5000/graphql)

---

### Local Development Setup

#### 1. Start Infrastructure Dependencies
```bash
docker compose up -d postgres redis
```

#### 2. Configure Environment Files
In `gateway/.env.local`:
```ini
DATABASE_URL="postgresql://postgres:khushal3526@localhost:5432/spikeflow?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=4000
```

In `frontend/.env.local`:
```ini
NEXT_PUBLIC_API_URL="http://localhost:4000/graphql"
```

In `product-service/.env.local`:
```ini
DATABASE_URL="postgresql://postgres:khushal3526@localhost:5432/spikeflow?schema=public"
PORT=5000
```

#### 3. Run Database Migrations & Seeds
```bash
cd gateway
npx prisma db push

cd ../product-service
npx prisma db push
npm run seed
```

#### 4. Start Development Servers
In Terminal 1 (Gateway):
```bash
cd gateway
npm run dev
```

In Terminal 2 (Product Service):
```bash
cd product-service
npm run dev
```

In Terminal 3 (Frontend):
```bash
cd frontend
npm run dev
```

---

## 📑 GraphQL Management API Reference

### Queries
```graphql
query GetDashboardTelemetry {
  executionHistory {
    id
    operationId
    runtimeChosen
    decisionReason
    cpuUsage
    memoryUsage
    cacheHit
    responseTime
    status
    createdAt
  }
  operations {
    id
    name
    type
    priority
  }
}
```

### Mutations
```graphql
mutation ProvisionInfrastructure {
  # 1. Create Organization
  createOrganization(input: { name: "Acme Corp", slug: "acme-corp" }) {
    id
  }

  # 2. Create Application
  createApplication(input: {
    organizationId: "<ORG_ID>",
    name: "Storefront",
    description: "Main e-commerce storefront"
  }) {
    id
  }

  # 3. Register GraphQL Service
  createGraphQLService(input: {
    applicationId: "<APP_ID>",
    name: "Catalog Microservice",
    endpoint: "http://product-service:5000/graphql",
    environment: "production"
  }) {
    id
  }

  # 4. Register Operation
  createOperation(input: {
    graphQLServiceId: "<SERVICE_ID>",
    name: "GetProducts",
    type: QUERY,
    estimatedCost: LOW,
    priority: MEDIUM,
    cacheable: true,
    requiresDatabase: true
  }) {
    id
  }

  # 5. Configure Routing Policy
  createRoutingPolicy(input: {
    operationId: "<OPERATION_ID>",
    preferredRuntime: DOCKER,
    cpuThreshold: 75.0,
    requestThreshold: 2000,
    enabled: true
  }) {
    id
  }
}
```

---

## 🧪 End-to-End Verification Workflow

Once the system is running, verify the full execution flow:

```bash
# Send test query to the Gateway
curl -X POST http://localhost:4000/gateway \
  -H "Content-Type: application/json" \
  -d '{"query": "query GetProducts { products { id name price } }"}'
```

Expected Response:
```json
{
  "data": {
    "products": [
      { "id": "1", "name": "Wireless Noise-Cancelling Headphones", "price": 299.99 },
      { "id": "2", "name": "Ergonomic Mechanical Keyboard", "price": 149.5 },
      { "id": "3", "name": "Ultra-Wide Gaming Monitor 34\"", "price": 699.0 }
    ]
  }
}
```

Open **http://localhost:3000/dashboard** to observe the newly recorded request, latency metrics, and runtime routing decisions in real time.

---

## 📂 Project Structure

```
SpikeFlow/
├── gateway/                        # Core Intelligent Gateway
│   ├── src/
│   │   ├── domains/
│   │   │   ├── organization/       # Organization Domain
│   │   │   ├── application/        # Application Domain
│   │   │   ├── graphql-service/    # Upstream Service Domain
│   │   │   ├── operation/          # AST Operation Domain
│   │   │   ├── routing-policy/     # Policy & Threshold Domain
│   │   │   ├── decision-engine/    # Heuristic Decision Engine
│   │   │   ├── runtime/            # Pluggable Runtime Executors
│   │   │   ├── metrics/            # System Telemetry Collectors
│   │   │   ├── gateway/            # Gateway Forwarding & Proxy
│   │   │   └── execution-history/  # Observability & History Domain
│   │   ├── shared/                 # Cache, Logger, Database utilities
│   │   └── app.ts                  # Apollo Server bootstrap
│   └── prisma/                     # Database Schema & Migrations
│
├── frontend/                       # Developer & Telemetry Dashboard
│   ├── src/
│   │   ├── app/                    # Next.js App Router Pages
│   │   ├── components/             # Reusable UI & Layout Components
│   │   └── lib/                    # GraphQL Client, Queries, Mutations
│   └── Dockerfile
│
├── product-service/                # Sample Upstream Microservice
├── nginx/                          # Perimeter Reverse Proxy
├── docs/                           # Technical Specifications & Architecture Docs
├── docker-compose.yml              # Multi-Container Orchestration
└── README.md
```

---

## 📜 License

This project is licensed under the ISC License.
