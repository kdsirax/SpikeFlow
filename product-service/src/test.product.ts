import http from "http";
import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./domains/product/product.schema.js";
import { resolvers, type GraphQLContext } from "./domains/product/product.resolver.js";
import { ProductService } from "./domains/product/product.service.js";
import type { IProductRepository } from "./domains/product/product.repository.js";
import type { CreateProductInput, Product, UpdateProductInput } from "./domains/product/product.types.js";
import { AppError } from "./shared/errors/AppError.js";
import { ValidationError } from "./shared/errors/ValidationError.js";
import { NotFoundError } from "./shared/errors/NotFoundError.js";
import { logger } from "./shared/logger/logger.js";

// ── In-Memory Repository for Fast Independent Unit & Integration Testing ───
class InMemoryProductRepository implements IProductRepository {
  public products: Product[] = [];

  async create(data: CreateProductInput): Promise<Product> {
    const product: Product = {
      id: "prod-" + Math.random().toString(36).substring(7),
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      stock: data.stock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.push(product);
    return product;
  }

  async findAll(): Promise<Product[]> {
    return [...this.products];
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) || null;
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }
    const current = this.products[index]!;
    const updated: Product = {
      ...current,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.stock !== undefined && { stock: data.stock }),
      updatedAt: new Date().toISOString(),
    };
    this.products[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }
    this.products.splice(index, 1);
    return true;
  }
}

async function runProductServiceTests() {
  console.log("\n=======================================================");
  console.log("🚀 Starting Product Service Comprehensive Test Suite");
  console.log("=======================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  const mockRepo = new InMemoryProductRepository();
  const productService = new ProductService(mockRepo);

  // ── 1. Unit Tests for Service Layer & Validation ──────────────────────────
  console.log("\n--- Service Layer & Validation Tests ---");

  // 1.1 Create Product Success
  const laptop = await productService.createProduct({
    name: "MacBook Pro M3",
    description: "Apple M3 Pro 36GB RAM",
    price: 2499.99,
    stock: 15,
  });
  assert(laptop.name === "MacBook Pro M3", "Create product sets name correctly");
  assert(laptop.price === 2499.99, "Create product sets price correctly");
  assert(laptop.stock === 15, "Create product sets stock correctly");
  assert(Boolean(laptop.id), "Product gets assigned a unique ID");

  // 1.2 Validation: Empty Name
  try {
    await productService.createProduct({
      name: "   ",
      price: 100,
      stock: 10,
    });
    assert(false, "Empty product name should throw ValidationError");
  } catch (err) {
    assert(err instanceof ValidationError, "Empty product name throws ValidationError");
  }

  // 1.3 Validation: Negative Price
  try {
    await productService.createProduct({
      name: "Invalid Price Product",
      price: -50,
      stock: 10,
    });
    assert(false, "Negative price should throw ValidationError");
  } catch (err) {
    assert(err instanceof ValidationError, "Negative price throws ValidationError");
  }

  // 1.4 Validation: Negative Stock
  try {
    await productService.createProduct({
      name: "Invalid Stock Product",
      price: 50,
      stock: -5,
    });
    assert(false, "Negative stock should throw ValidationError");
  } catch (err) {
    assert(err instanceof ValidationError, "Negative stock throws ValidationError");
  }

  // 1.5 Get All Products
  const allProducts = await productService.getProducts();
  assert(allProducts.length === 1, "getProducts returns all created products");

  // 1.6 Get Product By ID
  const fetched = await productService.getProductById(laptop.id);
  assert(fetched.id === laptop.id, "getProductById returns matching product");

  // 1.7 Get Product By ID Not Found
  try {
    await productService.getProductById("non-existent-id");
    assert(false, "getProductById with invalid ID should throw NotFoundError");
  } catch (err) {
    assert(err instanceof NotFoundError, "Non-existent product ID throws NotFoundError");
  }

  // 1.8 Update Product
  const updated = await productService.updateProduct(laptop.id, {
    price: 2299.99,
    stock: 12,
  });
  assert(updated.price === 2299.99, "updateProduct updates price correctly");
  assert(updated.stock === 12, "updateProduct updates stock correctly");

  // 1.9 Delete Product
  const deleted = await productService.deleteProduct(laptop.id);
  assert(deleted === true, "deleteProduct returns true on success");

  // 1.10 Verify Deletion
  const productsAfterDelete = await productService.getProducts();
  assert(productsAfterDelete.length === 0, "Product list is empty after deletion");

  // ── 2. End-to-End Apollo Server GraphQL API Tests ─────────────────────────
  console.log("\n--- Apollo Server GraphQL API Tests ---");

  // Initialize test server
  const testServer = new ApolloServer<GraphQLContext>({
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
      return {
        message: formattedError.message,
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          statusCode: 500,
        },
      };
    },
  });

  const TEST_PORT = 5055;
  const { url } = await startStandaloneServer(testServer, {
    context: async () => ({ productService }),
    listen: { port: TEST_PORT, host: "127.0.0.1" },
  });

  // 2.1 GraphQL Mutation: createProduct
  const createMutation = `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) {
        id
        name
        description
        price
        stock
        createdAt
        updatedAt
      }
    }
  `;

  const createRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: createMutation,
      variables: {
        input: {
          name: "Gaming Keyboard",
          description: "RGB Mechanical Keyboard",
          price: 129.99,
          stock: 50,
        },
      },
    }),
  });

  const createData: any = await createRes.json();
  assert(!createData.errors, "createProduct mutation succeeds without GraphQL errors");
  const createdProd = createData.data.createProduct;
  assert(createdProd.name === "Gaming Keyboard", "createProduct returns created product name");
  assert(createdProd.price === 129.99, "createProduct returns created product price");

  // 2.2 GraphQL Query: products
  const productsQuery = `
    query GetProducts {
      products {
        id
        name
        price
        stock
      }
    }
  `;

  const listRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: productsQuery }),
  });

  const listData: any = await listRes.json();
  assert(listData.data.products.length === 1, "GraphQL products query returns list with 1 product");
  assert(listData.data.products[0].name === "Gaming Keyboard", "Product in list matches created product");

  // 2.3 GraphQL Query: product(id)
  const singleProductQuery = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        price
      }
    }
  `;

  const singleRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: singleProductQuery,
      variables: { id: createdProd.id },
    }),
  });

  const singleData: any = await singleRes.json();
  assert(singleData.data.product.id === createdProd.id, "product(id) query returns the correct product");

  // 2.4 GraphQL Mutation: updateProduct
  const updateMutation = `
    mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
      updateProduct(id: $id, input: $input) {
        id
        name
        price
        stock
      }
    }
  `;

  const updateRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: updateMutation,
      variables: {
        id: createdProd.id,
        input: {
          price: 99.99,
          stock: 45,
        },
      },
    }),
  });

  const updateData: any = await updateRes.json();
  assert(updateData.data.updateProduct.price === 99.99, "updateProduct mutation updates price to 99.99");
  assert(updateData.data.updateProduct.stock === 45, "updateProduct mutation updates stock to 45");

  // 2.5 GraphQL Mutation: deleteProduct
  const deleteMutation = `
    mutation DeleteProduct($id: ID!) {
      deleteProduct(id: $id)
    }
  `;

  const deleteRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: deleteMutation,
      variables: { id: createdProd.id },
    }),
  });

  const deleteData: any = await deleteRes.json();
  assert(deleteData.data.deleteProduct === true, "deleteProduct mutation returns true");

  // 2.6 Error handling on GraphQL API (NotFoundError)
  const notFoundRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: singleProductQuery,
      variables: { id: "non-existent-prod" },
    }),
  });

  const notFoundData: any = await notFoundRes.json();
  assert(notFoundData.errors && notFoundData.errors.length > 0, "Query for non-existent product returns GraphQL errors");
  assert(
    notFoundData.errors[0].extensions.code === "NotFoundError",
    "Error extension contains NotFoundError code"
  );
  assert(
    notFoundData.errors[0].extensions.statusCode === 404,
    "Error extension contains 404 status code"
  );

  // Stop test server
  await testServer.stop();

  console.log("\n=======================================================");
  console.log(`🎉 All ${passedTests}/${totalTests} Product Service Tests Passed Successfully!`);
  console.log("=======================================================\n");
}

runProductServiceTests().catch((err) => {
  console.error("Product service test execution failed:", err);
  process.exit(1);
});
