import type { IOrganizationRepository } from "./organization.repository.js";
import type { CreateOrganizationInput, UpdateOrganizationInput, Organization } from "./organization.types.js";
import { logger } from "../../shared/logger/logger.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export class OrganizationService {
  constructor(private readonly repository: IOrganizationRepository) {}

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const existing = await this.repository.findByName(input.name);
    if (existing) {
      throw new ValidationError("Organization name already exists");
    }

    const created = await this.repository.create(input);
    logger.info({ organizationId: created.id, name: created.name }, "Organization created");
    return created;
  }

  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Organization not found");
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.repository.findByName(input.name);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError("Organization name already exists");
      }
    }

    const updated = await this.repository.update(id, input);
    logger.info({ organizationId: updated.id, name: updated.name }, "Organization updated");
    return updated;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Organization not found");
    }

    const deleted = await this.repository.delete(id);
    logger.info({ organizationId: id }, "Organization deleted");
    return deleted;
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.repository.findAll();
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.repository.findById(id);
  }
}
