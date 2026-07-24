import { randomUUID } from "crypto";
import type { IOperationRepository } from "./operation.repository.js";
import type { IGraphQLServiceRepository } from "../graphql-service/graphql-service.repository.js";
import type { CreateOperationInput, Operation } from "./operation.types.js";

export class OperationService {
  constructor(
    private readonly repository: IOperationRepository,
    private readonly graphqlServiceRepository: IGraphQLServiceRepository
  ) {}

  async createOperation(input: CreateOperationInput): Promise<Operation> {
    const service = await this.graphqlServiceRepository.findById(input.graphQLServiceId);
    if (!service) {
      throw new Error("GraphQL Service not found");
    }

    const now = new Date();
    const operation: Operation = {
      id: randomUUID(),
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    return this.repository.create(operation);
  }

  async getOperations(): Promise<Operation[]> {
    return this.repository.findAll();
  }

  async getOperationById(id: string): Promise<Operation | undefined> {
    return this.repository.findById(id);
  }
}
