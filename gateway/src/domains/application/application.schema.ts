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

  input UpdateApplicationInput {
    organizationId: ID
    name: String
    description: String
  }

  extend type Query {
    applications: [Application!]!
    application(id: ID!): Application
  }

  extend type Mutation {
    createApplication(input: CreateApplicationInput!): Application!
    updateApplication(id: ID!, input: UpdateApplicationInput!): Application!
    deleteApplication(id: ID!): Boolean!
  }
`;
