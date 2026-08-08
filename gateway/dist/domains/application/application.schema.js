export const typeDefs = `#graphql
  type Application {
    id: ID!
    organizationId: ID!
    name: String!
    description: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateApplicationInput {
    organizationId: ID!
    name: String!
    description: String!
  }

  extend type Query {
    applications: [Application!]!
    application(id: ID!): Application
  }

  extend type Mutation {
    createApplication(input: CreateApplicationInput!): Application!
  }
`;
//# sourceMappingURL=application.schema.js.map