export const typeDefs = `#graphql
  enum Runtime {
    DOCKER
    SERVERLESS
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

  input CreateRoutingPolicyInput {
    operationId: ID!
    preferredRuntime: Runtime!
    cpuThreshold: Int!
    requestThreshold: Int!
    enabled: Boolean!
  }

  extend type Query {
    routingPolicies: [RoutingPolicy!]!
    routingPolicy(id: ID!): RoutingPolicy
  }

  extend type Mutation {
    createRoutingPolicy(input: CreateRoutingPolicyInput!): RoutingPolicy!
  }
`;
//# sourceMappingURL=routing-policy.schema.js.map