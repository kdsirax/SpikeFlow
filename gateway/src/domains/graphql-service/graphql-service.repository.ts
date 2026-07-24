import type { GraphQLService } from "./graphql-service.types.js";

export interface IGraphQLServiceRepository {
  create(graphqlService: GraphQLService): Promise<GraphQLService>;
  findAll(): Promise<GraphQLService[]>;
  findById(id: string): Promise<GraphQLService | undefined>;
}

export class MemoryGraphQLServiceRepository implements IGraphQLServiceRepository {
  private services: GraphQLService[] = [];

  async create(graphqlService: GraphQLService): Promise<GraphQLService> {
    this.services.push(graphqlService);
    return graphqlService;
  }

  async findAll(): Promise<GraphQLService[]> {
    return this.services;
  }

  async findById(id: string): Promise<GraphQLService | undefined> {
    return this.services.find((s) => s.id === id);
  }
}
