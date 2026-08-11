export const typeDefs = `#graphql
  type Organization {
    id: ID!
    name: String!
    slug: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateOrganizationInput {
    name: String!
    slug: String!
  }

  input UpdateOrganizationInput {
    name: String
    slug: String
  }

  type Query {
    organizations: [Organization!]!
    organization(id: ID!): Organization
  }

  type Mutation {
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
    deleteOrganization(id: ID!): Boolean!
  }
`;
