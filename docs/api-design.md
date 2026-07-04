# GraphQL API Design

The SpikeFlow platform API is designed around resource-oriented nouns that define applications, their registered APIs, routing policies, operational metrics, and request logs.

---

## 1. Core GraphQL Types

### 1.1 Application
Represents an organization's client application that owns registered APIs.
```graphql
type Application {
  id: ID!
  name: String!
  owner: String!
  createdAt: String!
  apis: [API!]!
}
```

### 1.2 API
Represents an individual GraphQL API endpoint managed by SpikeFlow.
```graphql
type API {
  id: ID!
  name: String!
  endpoint: String!
  application: Application!
  operations: [OperationMetadata!]!
}
```

### 1.3 OperationMetadata
Defines characteristics of a specific GraphQL operation used by the Decision Engine.
```graphql
type OperationMetadata {
  id: ID!
  operationName: String!
  estimatedCost: Int!       # Computational cost estimation (1-100)
  cacheable: Boolean!
  requiresDatabase: Boolean!
  priority: String!         # HIGH, MEDIUM, LOW
  preferredRuntime: String! # DOCKER, SERVERLESS, DYNAMIC
}
```

### 1.4 RoutingRule
A rule governing how a specific operation should be routed under normal vs. peak circumstances.
```graphql
type RoutingRule {
  id: ID!
  operationName: String!
  destination: String!      # DOCKER, SERVERLESS
  condition: String!        # e.g., "CPU_USAGE > 70%" or "ALWAYS"
  enabled: Boolean!
  createdAt: String!
}
```

### 1.5 Request
An audit log entry of a processed query/mutation, showing routing details.
```graphql
type Request {
  id: ID!
  operationName: String!
  destination: String!
  responseTime: Int!        # In milliseconds
  status: String!           # SUCCESS, FAILED
  reason: String!           # Explanation of routing choice
  timestamp: String!
}
```

### 1.6 Metrics
Real-time aggregated health and throughput measurements of the system.
```graphql
type Metrics {
  totalRequests: Int!
  averageLatency: Float!
  errorRate: Float!
  activeRequests: Int!
}
```

### 1.7 Service
Status of a containerized or serverless backend service node.
```graphql
type Service {
  id: ID!
  name: String!
  status: String!           # HEALTHY, UNHEALTHY, DEGRADED
  cpuUsage: Float!
  memoryUsage: Float!
}
```

---

## 2. Query Specifications

Queries are read-only operations designed to pull state without side-effects.

```graphql
type Query {
  # Application Queries
  getApplications: [Application!]!
  getApplication(id: ID!): Application

  # API Queries
  getApis(applicationId: ID!): [API!]!
  
  # Policy & Routing Queries
  getRoutingRules: [RoutingRule!]!
  
  # Monitoring & History Queries
  getSystemMetrics: Metrics!
  getServices: [Service!]!
  getRecentRequests(limit: Int): [Request!]!
  getRequest(id: ID!): Request
}
```

---

## 3. Mutation Specifications

Mutations modify system configuration, register new services, or trigger actions.

```graphql
type Mutation {
  # Application Registration
  registerApplication(name: String!, owner: String!): Application!
  deleteApplication(id: ID!): Boolean!

  # API Registration
  registerApi(applicationId: ID!, name: String!, endpoint: String!): API!

  # Routing Policies
  createRoutingRule(
    operationName: String!
    destination: String!
    condition: String!
  ): RoutingRule!
  
  updateRoutingRule(
    id: ID!
    destination: String
    condition: String
    enabled: Boolean
  ): RoutingRule!
  
  deleteRoutingRule(id: ID!): Boolean!

  # Traffic Simulation
  simulateTraffic(requestsPerSecond: Int!, durationSeconds: Int!): Boolean!
}
```

---

## 4. Design Guidelines

> [!NOTE]
> All mutations returning object types must return the created/modified object rather than just a boolean, ensuring the UI/client cache updates immediately without sending a follow-up query.

- **Errors:** Handled using GraphQL error payloads with custom extension codes (e.g., `UNAUTHENTICATED`, `VALIDATION_FAILED`, `RUNTIME_UNAVAILABLE`).
- **IDs:** String UUIDs generated automatically upon creation.
- **Strict Typing:** Always prefer specific enums (e.g., Runtime destination as `DOCKER | SERVERLESS`) rather than raw strings where possible.