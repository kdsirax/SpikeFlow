# SpikeFlow Database Architecture & Data Modeling Specification

## 1. Storage Architecture Overview

SpikeFlow employs a dual-tiered data persistence strategy combining:
- **Persistent Relational Store (PostgreSQL 17):** Governs multi-tenant configuration, metadata hierarchies, routing policies, and audit logs.
- **Fast-Path In-Memory Store (Redis 8):** Caches resolved query tuples, service metadata, and performance-critical gateway lookups.

---

## 2. Relational Entity Schema (PostgreSQL via Prisma ORM)

```mermaid
erDiagram
    Organization ||--o{ Application : has
    Application ||--o{ GraphQLService : contains
    GraphQLService ||--o{ Operation : exposes
    Operation ||--o| RoutingPolicy : governed_by
    Operation ||--o{ ExecutionHistory : logged_as

    Organization {
        string id PK "UUID"
        string name "Tenant name"
        string slug UK "Unique slug identifier"
        datetime createdAt
        datetime updatedAt
    }

    Application {
        string id PK "UUID"
        string organizationId FK
        string name "Application name"
        string description "Optional description"
        datetime createdAt
        datetime updatedAt
    }

    GraphQLService {
        string id PK "UUID"
        string applicationId FK
        string name "Microservice name"
        string endpoint "Upstream URL"
        string environment "development | staging | production"
        datetime createdAt
        datetime updatedAt
    }

    Operation {
        string id PK "UUID"
        string graphQLServiceId FK
        string name "Canonical AST name"
        enum type "QUERY | MUTATION"
        enum estimatedCost "LOW | MEDIUM | HIGH"
        boolean cacheable "Redis response caching"
        boolean requiresDatabase "DB connection requirement"
        enum priority "LOW | MEDIUM | HIGH"
        datetime createdAt
        datetime updatedAt
    }

    RoutingPolicy {
        string id PK "UUID"
        string operationId FK, UK "1:1 Operation relation"
        enum preferredRuntime "DOCKER | SERVERLESS"
        float cpuThreshold "Threshold percentage (e.g. 80.0)"
        int requestThreshold "Rate limit ceiling"
        boolean enabled "Policy active toggle"
        datetime createdAt
        datetime updatedAt
    }

    ExecutionHistory {
        string id PK "UUID"
        string operationId FK
        string runtimeChosen "DOCKER | SERVERLESS | KUBERNETES"
        string decisionReason "Diagnostic explanation"
        float cpuUsage "Host CPU % at execution"
        float memoryUsage "Host Memory % at execution"
        boolean cacheHit "Cache hit flag"
        int responseTime "Latency in milliseconds"
        string status "SUCCESS | FAILED"
        datetime createdAt "Timestamp"
    }
```

---

## 3. Redis Caching Topology & Invalidation Strategy

To achieve sub-millisecond query metadata resolution, SpikeFlow implements an active cache-aside pattern with automatic invalidation on updates.

### 3.1 Cache Key Namespace Specifications

| Cache Key Pattern | Data Structure | TTL | Purpose |
| :--- | :--- | :--- | :--- |
| `operation:{operationName}` | String (JSON) | 1 hour | Serialized `Operation` metadata |
| `service:{serviceId}` | String (JSON) | 1 hour | Serialized `GraphQLService` connection parameters |
| `routingPolicy:{operationId}` | String (JSON) | 1 hour | Serialized `RoutingPolicy` threshold configuration |
| `resolved:{operationName}` | String (JSON) | 1 hour | Consolidated `{ operation, service, policy }` tuple |

### 3.2 Invalidation Workflow
Whenever an `Operation`, `GraphQLService`, or `RoutingPolicy` is modified via GraphQL mutations, SpikeFlow invalidates the primary key and the composite `resolved:<name>` key:

```typescript
// Pattern: Write to PostgreSQL -> Invalidate Redis -> Reload on next read
async invalidateCacheByName(operationName: string): Promise<void> {
  await Promise.all([
    this.cache.delete(CacheKeys.operation(operationName)),
    this.cache.delete(CacheKeys.resolvedRequest(operationName)),
  ]);
}
```
