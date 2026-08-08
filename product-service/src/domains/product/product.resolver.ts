import type { ProductService } from "./product.service.js";
import type { CreateProductInput, UpdateProductInput, Product } from "./product.types.js";

export interface GraphQLContext {
  productService: ProductService;
}

export const resolvers = {
  Query: {
    products: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Product[]> => {
      return context.productService.getProducts();
    },

    product: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ): Promise<Product | null> => {
      return context.productService.getProductById(id);
    },
  },

  Mutation: {
    createProduct: async (
      _parent: unknown,
      { input }: { input: CreateProductInput },
      context: GraphQLContext
    ): Promise<Product> => {
      return context.productService.createProduct(input);
    },

    updateProduct: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateProductInput },
      context: GraphQLContext
    ): Promise<Product> => {
      return context.productService.updateProduct(id, input);
    },

    deleteProduct: async (
      _parent: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      return context.productService.deleteProduct(id);
    },
  },
};
