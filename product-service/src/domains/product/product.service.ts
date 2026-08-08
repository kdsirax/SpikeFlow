import type { IProductRepository } from "./product.repository.js";
import type { CreateProductInput, Product, UpdateProductInput } from "./product.types.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class ProductService {
  constructor(private readonly repository: IProductRepository) {}

  /**
   * Validate and create a new product.
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
      throw new ValidationError("Product name is required and cannot be empty.");
    }

    if (typeof input.price !== "number" || isNaN(input.price) || input.price < 0) {
      throw new ValidationError("Product price must be a non-negative number.");
    }

    if (typeof input.stock !== "number" || isNaN(input.stock) || !Number.isInteger(input.stock) || input.stock < 0) {
      throw new ValidationError("Product stock must be a non-negative integer.");
    }

    const created = await this.repository.create({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      stock: input.stock,
    });

    logger.info(
      { productId: created.id, name: created.name, price: created.price, stock: created.stock },
      "Product created"
    );

    return created;
  }

  /**
   * Retrieve all products.
   */
  async getProducts(): Promise<Product[]> {
    return this.repository.findAll();
  }

  /**
   * Retrieve a single product by ID.
   */
  async getProductById(id: string): Promise<Product> {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new ValidationError("Product ID is required.");
    }

    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    return product;
  }

  /**
   * Validate and update an existing product.
   */
  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new ValidationError("Product ID is required.");
    }

    // Verify existence
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || input.name.trim().length === 0) {
        throw new ValidationError("Product name cannot be empty.");
      }
      input.name = input.name.trim();
    }

    if (input.price !== undefined) {
      if (typeof input.price !== "number" || isNaN(input.price) || input.price < 0) {
        throw new ValidationError("Product price must be a non-negative number.");
      }
    }

    if (input.stock !== undefined) {
      if (typeof input.stock !== "number" || isNaN(input.stock) || !Number.isInteger(input.stock) || input.stock < 0) {
        throw new ValidationError("Product stock must be a non-negative integer.");
      }
    }

    const updated = await this.repository.update(id, input);

    logger.info(
      { productId: updated.id, name: updated.name, price: updated.price, stock: updated.stock },
      "Product updated"
    );

    return updated;
  }

  /**
   * Delete an existing product.
   */
  async deleteProduct(id: string): Promise<boolean> {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new ValidationError("Product ID is required.");
    }

    // Verify existence
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    await this.repository.delete(id);

    logger.info({ productId: id }, "Product deleted");

    return true;
  }
}
