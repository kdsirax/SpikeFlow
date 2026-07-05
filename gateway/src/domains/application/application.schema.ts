export const typeDefs = `#graphql
  type Application {
    id: ID!
    organizationId: String!
    name: String!
    description: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateApplicationInput {
    organizationId: String!
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
