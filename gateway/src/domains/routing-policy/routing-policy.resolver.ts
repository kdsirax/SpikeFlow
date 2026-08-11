import type {
  CreateRoutingPolicyInput,
  UpdateRoutingPolicyInput,
} from "./routing-policy.types.js";
import type { RoutingPolicyService } from "./routing-policy.service.js";

interface RoutingPolicyContext {
  routingPolicyService: RoutingPolicyService;
}

export const resolvers = {
  Query: {
    routingPolicies: async (
      _parent: unknown,
      _args: unknown,
      context: RoutingPolicyContext
    ) => {
      return context.routingPolicyService.getRoutingPolicies();
    },
    routingPolicy: async (
      _parent: unknown,
      { id }: { id: string },
      context: RoutingPolicyContext
    ) => {
      return context.routingPolicyService.getRoutingPolicyById(id);
    },
  },
  Mutation: {
    createRoutingPolicy: async (
      _parent: unknown,
      { input }: { input: CreateRoutingPolicyInput },
      context: RoutingPolicyContext
    ) => {
      return context.routingPolicyService.createRoutingPolicy(input);
    },
    updateRoutingPolicy: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateRoutingPolicyInput },
      context: RoutingPolicyContext
    ) => {
      return context.routingPolicyService.updateRoutingPolicy(id, input);
    },
    deleteRoutingPolicy: async (
      _parent: unknown,
      { id }: { id: string },
      context: RoutingPolicyContext
    ) => {
      return context.routingPolicyService.deleteRoutingPolicy(id);
    },
  },
};
