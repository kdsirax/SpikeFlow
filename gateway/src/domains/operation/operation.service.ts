import type { IOperationRepository } from "./operation.repository.js";
import type { IGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import type { CreateOperationInput, Operation } from "./operation.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class OperationService {
  constructor(
    private readonly repository: IOperationRepository,
    private readonly graphqlServiceRepository: IGraphQLServiceRepository
  ) {}

  async createOperation(input: CreateOperationInput): Promise<Operation> {
    const service = await this.graphqlServiceRepository.findById(input.graphQLServiceId);
    if (!service) {
      throw new NotFoundError("GraphQL Service not found");
    }

    const created = await this.repository.create(input);
    logger.info({ operationId: created.id, name: created.name }, "Operation created");
    return created;
  }

  async getOperations(): Promise<Operation[]> {
    return this.repository.findAll();
  }

  async getOperationById(id: string): Promise<Operation | null> {
    return this.repository.findById(id);
  }
}
