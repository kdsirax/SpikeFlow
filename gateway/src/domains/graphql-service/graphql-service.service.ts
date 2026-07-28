import type { IGraphQLServiceRepository } from "./graphql-service.repository.js";
import type { IApplicationRepository } from "../application/application.repository.js";
import type { CreateGraphQLServiceInput, GraphQLService } from "./graphql-service.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class GraphQLServiceService {
  constructor(
    private readonly repository: IGraphQLServiceRepository,
    private readonly applicationRepository: IApplicationRepository
  ) {}

  async createGraphQLService(input: CreateGraphQLServiceInput): Promise<GraphQLService> {
    const application = await this.applicationRepository.findById(input.applicationId);
    if (!application) {
      throw new NotFoundError("Application not found");
    }

    const created = await this.repository.create(input);
    logger.info({ serviceId: created.id, name: created.name }, "GraphQL service created");
    return created;
  }

  async getGraphQLServices(): Promise<GraphQLService[]> {
    return this.repository.findAll();
  }

  async getGraphQLServiceById(id: string): Promise<GraphQLService | null> {
    return this.repository.findById(id);
  }
}
