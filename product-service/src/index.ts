import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./domains/product/product.schema.js";
import { resolvers, type GraphQLContext } from "./domains/product/product.resolver.js";
import { PrismaProductRepository } from "./domains/product/product.repository.js";
import { ProductService } from "./domains/product/product.service.js";
import { AppError } from "./shared/errors/AppError.js";
import { seedDatabase } from "./seed.js";
import { logger } from "./shared/logger/logger.js";

// Initialize Product domain repositories and services
const productRepository = new PrismaProductRepository();
export const productService = new ProductService(productRepository);

// Initialize Apollo Server
export const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    const originalError = unwrapResolverError(error);

    if (originalError instanceof AppError) {
      return {
        message: originalError.message,
        extensions: {
          code: originalError.name,
          statusCode: originalError.statusCode,
        },
      };
    }

    logger.error({ error: formattedError }, "Unhandled Apollo Server error");

    return {
      message: formattedError.message || "Internal server error",
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
      },
    };
  },
});

export async function startProductServer(port: number = Number(process.env.PORT) || 5000) {
  try {
    // Attempt database seed if empty
    await seedDatabase(productService).catch((err) => {
      logger.warn({ error: err.message }, "Database auto-seed skipped or encountered non-fatal error");
    });

    const { url } = await startStandaloneServer(server, {
      context: async () => ({
        productService,
      }),
      listen: { port, host: "0.0.0.0" },
    });

    logger.info(`🚀 Product GraphQL Service running at: ${url}`);
    return { url, server };
  } catch (error) {
    logger.error({ error }, "Failed to start Product Service");
    throw error;
  }
}

// Bootstrap when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startProductServer().catch((err) => {
    logger.error(err, "Product service startup error");
    process.exit(1);
  });
}
