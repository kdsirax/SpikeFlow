# Database Schema & Data Models

SpikeFlow uses a hybrid storage layer:
- **Persistent Store (PostgreSQL):** For system configurations, application metadata, routing rules, and historical metrics/analytics.
- **Cache/In-Memory Store (Redis):** For rate limiting counters, system status caches, and temporary request queues.

---

## 1. Entity Relationship Overview

```
┌─────────────────┐         ┌───────────┐         ┌───────────────────────┐
│  Applications   │1       *│   APIs    │1       *│   OperationMetadata   │
│ ────────────────│─────────│ ──────────│─────────│ ───────────────────── │
│ • id (PK)       │         │ • id (PK) │         │ • id (PK)             │
│ • name          │         │ • name    │         │ • operationName       │
│ • owner         │         │ • endpoint│         │ • estimatedCost       │
└────────┬────────┘         └───────────┘         └───────────────────────┘
         │
         │1
         │
         ▼ *
┌─────────────────┐         ┌───────────┐
│  RoutingRules   │         │ Requests  │ (Audit Log)
│ ────────────────│         │ ───────── │
│ • id (PK)       │         │ • id (PK) │
│ • operationName │         │ • opName  │
│ • destination   │         │ • dest    │
│ • condition     │         │ • latency │
└─────────────────┘         └───────────┘
```

---

## 2. Table Schemas (PostgreSQL)

### 2.1 `applications`
Stores registered client applications.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default: gen_random_uuid() | Unique identifier |
| `name` | `VARCHAR(255)` | Not Null, Unique | Name of application |
| `owner` | `VARCHAR(255)` | Not Null | Team/Owner email/identifier |
| `created_at` | `TIMESTAMP` | Default: CURRENT_TIMESTAMP | Creation timestamp |

### 2.2 `apis`
Stores backend APIs registered under applications.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier |
| `application_id` | `UUID` | Foreign Key -> `applications.id` ON DELETE CASCADE | Associated app |
| `name` | `VARCHAR(255)` | Not Null | API Endpoint name |
| `endpoint` | `TEXT` | Not Null | Full target gateway URL |

### 2.3 `operation_metadata`
Holds performance characteristics for routing evaluations.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier |
| `api_id` | `UUID` | Foreign Key -> `apis.id` ON DELETE CASCADE | Associated API |
| `operation_name` | `VARCHAR(255)`| Not Null, Unique | GraphQL Query/Mutation name |
| `estimated_cost` | `INT` | Check (estimated_cost BETWEEN 1 AND 100) | Metric score for resource usage |
| `cacheable` | `BOOLEAN` | Default: FALSE | Indicates if query result can be cached |
| `requires_db` | `BOOLEAN` | Default: FALSE | Requires active database pool connections |
| `priority` | `VARCHAR(50)` | Check (priority IN ('HIGH', 'MEDIUM', 'LOW')) | Priority class |
| `preferred_runtime`| `VARCHAR(50)`| Check (preferred_runtime IN ('DOCKER', 'SERVERLESS', 'DYNAMIC')) | Execution runtime target |

### 2.4 `routing_rules`
Defines active policies for dynamic or fallback paths.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier |
| `application_id` | `UUID` | Foreign Key -> `applications.id` | Target application scope |
| `operation_name` | `VARCHAR(255)`| Not Null | Operation name to target |
| `destination` | `VARCHAR(50)` | Check (destination IN ('DOCKER', 'SERVERLESS')) | Chosen destination |
| `condition` | `TEXT` | Default: 'ALWAYS' | JSON or String conditional routing rule |
| `enabled` | `BOOLEAN` | Default: TRUE | Active status of the rule |
| `created_at` | `TIMESTAMP` | Default: CURRENT_TIMESTAMP | Rule creation time |

### 2.5 `requests` (Audit Log)
Log for historical tracking and analysis.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier |
| `operation_name` | `VARCHAR(255)`| Not Null | Executed operation |
| `destination` | `VARCHAR(50)` | Not Null | Where it executed (DOCKER/SERVERLESS) |
| `response_time` | `INT` | Not Null | Execution time in ms |
| `status` | `VARCHAR(50)` | Not Null (e.g. 'SUCCESS', 'FAILED')| Status code representation |
| `reason` | `TEXT` | Not Null | Justification for routing route choice |
| `timestamp` | `TIMESTAMP` | Default: CURRENT_TIMESTAMP | When request arrived |

---

## 3. Redis Data Structures

### 3.1 Rate Limiting (Key-Value)
- **Key Format:** `ratelimit:{appId}:{operationName}:{clientId}`
- **Value:** Integer count of requests in current window.
- **Type:** String (with TTL expiration).
- **TTL:** 60 seconds (rolling/fixed window).

### 3.2 Service Health Cache (Hash)
- **Key:** `services:{serviceName}`
- **Fields:**
  - `status`: `"HEALTHY"` | `"UNHEALTHY"`
  - `cpuUsage`: Float (e.g., `45.2`)
  - `memoryUsage`: Float (e.g., `68.1`)
  - `lastHeartbeat`: Unix timestamp
