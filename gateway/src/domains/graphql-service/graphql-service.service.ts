import { randomUUID } from "crypto";
import type { IGraphQLServiceRepository } from "./graphql-service.repository.js";
import type { IApplicationRepository } from "../application/application.repository.js";
import type { CreateGraphQLServiceInput, GraphQLService } from "./graphql-service.types.js";

export class GraphQLServiceService {
  constructor(
    private readonly repository: IGraphQLServiceRepository,
    private readonly applicationRepository: IApplicationRepository
  ) {}

  async createGraphQLService(input: CreateGraphQLServiceInput): Promise<GraphQLService> {
    const application = await this.applicationRepository.findById(input.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    const now = new Date();
    const service: GraphQLService = {
      id: randomUUID(),
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    return this.repository.create(service);
  }

  async getGraphQLServices(): Promise<GraphQLService[]> {
    return this.repository.findAll();
  }

  async getGraphQLServiceById(id: string): Promise<GraphQLService | undefined> {
    return this.repository.findById(id);
  }
}
