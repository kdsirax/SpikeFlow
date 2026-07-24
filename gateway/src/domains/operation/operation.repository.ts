import type { Operation } from "./operation.types.js";

export interface IOperationRepository {
  create(operation: Operation): Promise<Operation>;
  findAll(): Promise<Operation[]>;
  findById(id: string): Promise<Operation | undefined>;
}

export class MemoryOperationRepository implements IOperationRepository {
  private operations: Operation[] = [];

  async create(operation: Operation): Promise<Operation> {
    this.operations.push(operation);
    return operation;
  }

  async findAll(): Promise<Operation[]> {
    return this.operations;
  }

  async findById(id: string): Promise<Operation | undefined> {
    return this.operations.find((op) => op.id === id);
  }
}
