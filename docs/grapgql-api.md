Step 1 — Identify Resources

Every API revolves around resources.

Ask yourself:

"What things exist in my system?"

I think Version 1 has these:

Application
API
RoutingRule
Request
Service
Metrics
RateLimit
TrafficEvent

Notice these are nouns, not verbs.

Good APIs revolve around nouns.

Step 2 — Define GraphQL Types

Let's design them.

Application
type Application {
    id: ID!
    name: String!
    owner: String!
    createdAt: String!
}
API

Represents an API registered by the client.

type API {
    id: ID!
    name: String!
    endpoint: String!
    application: Application!
}
RoutingRule
type RoutingRule {
    id: ID!
    operationName: String!
    destination: String!
    enabled: Boolean!
}

Example:

searchProducts

↓

Serverless
Request
type Request {
    id: ID!
    operationName: String!
    destination: String!
    responseTime: Int!
    status: String!
}
Metrics
type Metrics {
    totalRequests: Int!
    averageLatency: Float!
    errorRate: Float!
    activeRequests: Int!
}
Service
type Service {
    id: ID!
    name: String!
    status: String!
    cpuUsage: Float!
    memoryUsage: Float!
}

Later this becomes incredibly useful.

Step 3 — Queries

Remember:

Queries answer:

"Give me information."

Not:

"Do something."

I would design:

getApplications

getApplication(id)

getApis(applicationId)

getRoutingRules

getSystemMetrics

getServices

getTrafficHistory

getRecentRequests

getRequest(id)

getServiceHealth

Notice these are all read operations.

Step 4 — Mutations

Mutations change something.

registerApplication

registerApi

createRoutingRule

updateRoutingRule

deleteRoutingRule

updateRateLimit

enableServerless

disableServerless

simulateTraffic

deleteApplication


//operation metadata
id
operation name
estimated cost
cacheable
requiresdatabase
priority
preferredRuntime

// routing rules metadata


operationName
destination
condition
timeCreated







