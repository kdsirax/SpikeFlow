export const typeDefs = `#graphql
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

  enum OperationType {
    QUERY
    MUTATION
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

  input CreateOperationInput {
    graphQLServiceId: ID!
    name: String!
    type: OperationType!
    estimatedCost: EstimatedCost!
    cacheable: Boolean!
    requiresDatabase: Boolean!
    priority: Priority!
  }

  extend type Query {
    operations: [Operation!]!
    operation(id: ID!): Operation
  }

  extend type Mutation {
    createOperation(input: CreateOperationInput!): Operation!
  }
`;
//# sourceMappingURL=operation.schema.js.map