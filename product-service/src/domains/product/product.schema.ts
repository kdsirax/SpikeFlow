export const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    stock: Int!
    createdAt: String!
    updatedAt: String!
  }

  input CreateProductInput {
    name: String!
    description: String
    price: Float!
    stock: Int!
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    stock: Int
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
