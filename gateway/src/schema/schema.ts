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
        users: [User!]!
    }

    type Mutation {
        addUser( name: String!, age: Int!): User

        updateUser(id: ID!, name: String!, age: Int!): User
    }

`;

export const resolvers = {
    Query: {
        hello: () => "Hello from Apollo Server",

        user: (_: unknown, args: { id: string }) => {
            return users.find(user => user.id === args.id);
        },

        users: () => users
    },

    Mutation: {
        addUser: (_: unknown, args: { id: string, name: string, age: number }) => {
           const person = {
            id: String(users.length + 1),
            name: args.name,
            age: args.age,
           }
           users.push(person);
           console.log(person);

           return person;
        },
        
        updateUser :(_:unknown, args:{id: string, name:string, age:number})=>{
            const person = users.find( u => u.id === args.id);
            if ( person){
                person.name = args.name || person.name;
                person.age = args.age || person.age;

                return person;
            } else {
                throw new Error("User Not FOund");
            }
        }
    }
};