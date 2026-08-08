export const typeDefs = `#graphql
  type GraphQLService {
    id: ID!
    applicationId: ID!
    name: String!
    endpoint: String!
    environment: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateGraphQLServiceInput {
    applicationId: ID!
    name: String!
    endpoint: String!
    environment: String!
  }

  extend type Query {
    graphqlServices: [GraphQLService!]!
    graphqlService(id: ID!): GraphQLService
  }

  extend type Mutation {
    createGraphQLService(input: CreateGraphQLServiceInput!): GraphQLService!
  }
`;
//# sourceMappingURL=graphql-service.schema.js.map