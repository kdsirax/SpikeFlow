export const typeDefs = `#graphql
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

  extend type Query {
    executionHistory: [ExecutionHistory!]!
    executionHistoryById(id: ID!): ExecutionHistory
    executionHistoryByOperation(operationId: ID!): [ExecutionHistory!]!
  }
`;
