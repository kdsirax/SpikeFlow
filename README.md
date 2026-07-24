## Current Architecture

Organization
      │
      ▼
Application
      │
      ▼
GraphQLService
      │
      ▼
Operation
      │
      ▼
RoutingPolicy

We have built a unified GraphQL Gateway API using Apollo Server that supports five domains: Organizations, Applications, GraphQLServices, Operations, and RoutingPolicies. Each domain is implemented with a clean, layered architecture separating the schema, resolver, service, and memory repository layers. To enforce domain integrity across boundaries, cross-domain validators are executed in services via Constructor Dependency Injection of repositories (e.g., verifying an Application exists before creating a GraphQLService, verifying a GraphQLService exists before creating an Operation, and verifying an Operation exists before creating a RoutingPolicy). Finally, all GraphQL type definitions, enums, inputs, and resolver structures are merged dynamically at startup in `app.ts` under a single GraphQL endpoint.
