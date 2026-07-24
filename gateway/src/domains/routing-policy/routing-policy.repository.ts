import type { RoutingPolicy } from "./routing-policy.types.js";

export interface IRoutingPolicyRepository {
  create(routingPolicy: RoutingPolicy): Promise<RoutingPolicy>;
  findAll(): Promise<RoutingPolicy[]>;
  findById(id: string): Promise<RoutingPolicy | undefined>;
}

export class MemoryRoutingPolicyRepository implements IRoutingPolicyRepository {
  private policies: RoutingPolicy[] = [];

  async create(routingPolicy: RoutingPolicy): Promise<RoutingPolicy> {
    this.policies.push(routingPolicy);
    return routingPolicy;
  }

  async findAll(): Promise<RoutingPolicy[]> {
    return this.policies;
  }

  async findById(id: string): Promise<RoutingPolicy | undefined> {
    return this.policies.find((p) => p.id === id);
  }
}
