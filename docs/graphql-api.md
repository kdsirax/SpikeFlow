# SpikeFlow GraphQL Management API Specification

## 1. API Architecture

SpikeFlow exposes a unified GraphQL Management API at `http://localhost:4000/graphql` powered by Apollo Server. It allows operators and automated CI/CD pipelines to manage the complete multi-tenant infrastructure lifecycle:

$$\text{Organization} \longrightarrow \text{Application} \longrightarrow \text{GraphQLService} \longrightarrow \text{Operation} \longrightarrow \text{RoutingPolicy}$$

---

## 2. Schema Definitions

### 2.1 Enumerations
```graphql
enum OperationType {
  QUERY
  MUTATION
}

enum EstimatedCost {
  LOW
  MEDIUM
  HIGH
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Runtime {
  DOCKER
  SERVERLESS
}
```

### 2.2 Core Types
```graphql
type Organization {
  id: ID!
  name: String!
  slug: String!
  createdAt: String!
  updatedAt: String!
}

type Application {
  id: ID!
  organizationId: ID!
  name: String!
  description: String!
  createdAt: String!
  updatedAt: String!
}

type GraphQLService {
  id: ID!
  applicationId: ID!
  name: String!
  endpoint: String!
  environment: String!
  createdAt: String!
  updatedAt: String!
}

type Operation {
  id: ID!
  graphQLServiceId: ID!
  name: String!
  type: OperationType!
  estimatedCost: EstimatedCost!
  cacheable: Boolean!
  requiresDatabase: Boolean!
  priority: Priority!
  createdAt: String!
  updatedAt: String!
}

type RoutingPolicy {
  id: ID!
  operationId: ID!
  preferredRuntime: Runtime!
  cpuThreshold: Int!
  requestThreshold: Int!
  enabled: Boolean!
  createdAt: String!
  updatedAt: String!
}

type ExecutionHistory {
  id: ID!
  operationId: ID!
  runtimeChosen: String!
  decisionReason: String
  cpuUsage: Float
  memoryUsage: Float
  cacheHit: Boolean!
  responseTime: Int!
  status: String!
  createdAt: String!
}
```

---

## 3. Query Endpoints

```graphql
type Query {
  # Organizations
  organizations: [Organization!]!
  organization(id: ID!): Organization

  # Applications
  applications: [Application!]!
  application(id: ID!): Application

  # GraphQL Services
  graphqlServices: [GraphQLService!]!
  graphqlService(id: ID!): GraphQLService

  # Operations
  operations: [Operation!]!
  operation(id: ID!): Operation

  # Routing Policies
  routingPolicies: [RoutingPolicy!]!
  routingPolicy(id: ID!): RoutingPolicy

  # Observability & History
  executionHistory: [ExecutionHistory!]!
  executionHistoryById(id: ID!): ExecutionHistory
  executionHistoryByOperation(operationId: ID!): [ExecutionHistory!]!
}
```

---

## 4. Mutation Endpoints

```graphql
type Mutation {
  # Organization CRUD
  createOrganization(input: CreateOrganizationInput!): Organization!
  updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
  deleteOrganization(id: ID!): Boolean!

  # Application CRUD
  createApplication(input: CreateApplicationInput!): Application!
  updateApplication(id: ID!, input: UpdateApplicationInput!): Application!
  deleteApplication(id: ID!): Boolean!

  # GraphQL Service CRUD
  createGraphQLService(input: CreateGraphQLServiceInput!): GraphQLService!
  updateGraphQLService(id: ID!, input: UpdateGraphQLServiceInput!): GraphQLService!
  deleteGraphQLService(id: ID!): Boolean!

  # Operation CRUD
  createOperation(input: CreateOperationInput!): Operation!
  updateOperation(id: ID!, input: UpdateOperationInput!): Operation!
  deleteOperation(id: ID!): Boolean!

  # Routing Policy CRUD
  createRoutingPolicy(input: CreateRoutingPolicyInput!): RoutingPolicy!
  updateRoutingPolicy(id: ID!, input: UpdateRoutingPolicyInput!): RoutingPolicy!
  deleteRoutingPolicy(id: ID!): Boolean!
}
```

---

## 5. End-to-End Infrastructure Provisioning Mutation Example

```graphql
mutation CompleteInfrastructureOnboarding {
  org: createOrganization(input: {
    name: "Enterprise Solutions Inc.",
    slug: "enterprise-solutions"
  }) {
    id
  }

  app: createApplication(input: {
    organizationId: "<ORG_ID>",
    name: "Order Processing Service",
    description: "Core e-commerce checkout and inventory management"
  }) {
    id
  }

  svc: createGraphQLService(input: {
    applicationId: "<APP_ID>",
    name: "Orders Subgraph",
    endpoint: "http://product-service:5000/graphql",
    environment: "production"
  }) {
    id
  }

  op: createOperation(input: {
    graphQLServiceId: "<SERVICE_ID>",
    name: "SubmitOrder",
    type: MUTATION,
    estimatedCost: HIGH,
    priority: HIGH,
    cacheable: false,
    requiresDatabase: true
  }) {
    id
  }

  policy: createRoutingPolicy(input: {
    operationId: "<OPERATION_ID>",
    preferredRuntime: DOCKER,
    cpuThreshold: 85,
    requestThreshold: 5000,
    enabled: true
  }) {
    id
  }
}
```
