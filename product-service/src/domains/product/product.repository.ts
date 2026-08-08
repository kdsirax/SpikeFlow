import type { CreateProductInput, Product, UpdateProductInput } from "./product.types.js";
import { prisma, type DatabaseClient } from "../../shared/database/prisma.js";
import { handlePrismaError } from "../../shared/database/prisma-error.handler.js";
import type { Product as PrismaProduct } from "../../generated/prisma/client.js";

export interface IProductRepository {
  create(data: CreateProductInput): Promise<Product>;
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  update(id: string, data: UpdateProductInput): Promise<Product>;
  delete(id: string): Promise<boolean>;
}

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}

  private mapToDomain(item: PrismaProduct): Product {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async create(data: CreateProductInput): Promise<Product> {
    try {
      const created = await this.db.product.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          price: data.price,
          stock: data.stock,
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<Product[]> {
    const list = await this.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return list.map((item) => this.mapToDomain(item));
  }

  async findById(id: string): Promise<Product | null> {
    const item = await this.db.product.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    try {
      const updated = await this.db.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.stock !== undefined && { stock: data.stock }),
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.product.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
