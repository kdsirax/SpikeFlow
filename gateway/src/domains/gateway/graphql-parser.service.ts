import { parse, type OperationDefinitionNode, Kind } from "graphql";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { logger } from "../../shared/logger/logger.js";

export type GraphQLOperationType = "query" | "mutation" | "subscription";

export interface ParsedGraphQLOperation {
  operationType: GraphQLOperationType;
  operationName: string;
}

export class GraphQLParserService {
  /**
   * Parses a GraphQL request query string using the official graphql AST parser.
   * Extracts the operation type ('query' | 'mutation' | 'subscription') and operation name.
   * 
   * Enforces that every operation must be named.
   */
  parse(query: string): ParsedGraphQLOperation {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      throw new ValidationError("Every GraphQL operation must be named.");
    }

    let documentNode;
    try {
      documentNode = parse(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Syntax error in GraphQL query";
      logger.warn({ error: message }, "Failed to parse GraphQL query");
      throw new ValidationError(`Invalid GraphQL query: ${message}`);
    }

    const operationDefinition = documentNode.definitions.find(
      (def): def is OperationDefinitionNode => def.kind === Kind.OPERATION_DEFINITION
    );

    if (!operationDefinition) {
      throw new ValidationError("Every GraphQL operation must be named.");
    }

    const operationName = operationDefinition.name?.value;
    if (!operationName || operationName.trim().length === 0) {
      throw new ValidationError("Every GraphQL operation must be named.");
    }

    const operationType = operationDefinition.operation as GraphQLOperationType;

    logger.debug({ operationType, operationName }, "GraphQL query successfully parsed");

    return {
      operationType,
      operationName,
    };
  }
}
