export const typeDefs = `#graphql
  type RoutingDecision {
    runtime: Runtime!
    reason: String!
  }

  extend type Mutation {
    makeRoutingDecision(operationId: ID!): RoutingDecision!
  }
`;
//# sourceMappingURL=decision-engine.schema.js.map