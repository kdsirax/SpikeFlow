import type { RoutingDecision } from "./decison-engine.types.js";
import type { DecisionEngineService } from "./decision-engine.service.js";

interface DecisionEngineContext {
  decisionEngineService: DecisionEngineService;
}

export const resolvers = {
  Mutation: {
    makeRoutingDecision: async (
      _parent: unknown,
      { operationId }: { operationId: string },
      context: DecisionEngineContext
    ): Promise<RoutingDecision> => {
      return context.decisionEngineService.makeRoutingDecision(operationId);
    },
  },
};
