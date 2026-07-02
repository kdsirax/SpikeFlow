import { users } from "./user.js";

export const typeDefs = `#graphql
    type User {
        id: ID!
        name: String!
        age: Int!
    }

    type Query {
        hello: String!
        user(id: ID!): User
    }
`;

export const resolvers = {
    Query: {
        hello: () => "Hello from Apollo Server",

        user: (_: unknown, args: { id: string }) => {
            return users.find(user => user.id === args.id);
        }
    }
};