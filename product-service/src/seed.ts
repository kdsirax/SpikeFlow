import "dotenv/config";
import { PrismaProductRepository } from "./domains/product/product.repository.js";
import { ProductService } from "./domains/product/product.service.js";
import { logger } from "./shared/logger/logger.js";

export const SAMPLE_PRODUCTS = [
  {
    name: "Laptop",
    description: "High-performance developer workstation with 32GB RAM and 1TB NVMe SSD",
    price: 1299.99,
    stock: 25,
  },
  {
    name: "Keyboard",
    description: "Mechanical RGB gaming and coding keyboard with tactile brown switches",
    price: 149.99,
    stock: 80,
  },
  {
    name: "Mouse",
    description: "Ergonomic wireless precision mouse with adjustable DPI and Bluetooth 5.2",
    price: 79.99,
    stock: 120,
  },
  {
    name: "Monitor",
    description: "32-inch 4K UHD IPS display with 144Hz refresh rate and HDR600 support",
    price: 449.99,
    stock: 40,
  },
  {
    name: "Headphones",
    description: "Active noise-cancelling wireless headphones with 40-hour battery life",
    price: 199.99,
    stock: 65,
  },
];

export async function seedDatabase(productService: ProductService): Promise<void> {
  const existing = await productService.getProducts();
  if (existing.length > 0) {
    logger.info({ count: existing.length }, "Database already contains products. Skipping initial seed.");
    return;
  }

  logger.info("Seeding sample products into Product Service database...");

  for (const item of SAMPLE_PRODUCTS) {
    await productService.createProduct(item);
  }

  logger.info(`Successfully seeded ${SAMPLE_PRODUCTS.length} sample products.`);
}

// Standalone execution support
async function runStandaloneSeed() {
  const repository = new PrismaProductRepository();
  const productService = new ProductService(repository);

  try {
    await seedDatabase(productService);
    logger.info("Seed process completed.");
  } catch (error) {
    logger.error({ error }, "Error during database seed");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStandaloneSeed();
}
