import type { IOrganizationRepository } from "./organization.repository.js";
import type { CreateOrganizationInput, Organization } from "./organization.types.js";
import { logger } from "../../shared/logger/logger.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";

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

  async getOrganizations(): Promise<Organization[]> {
    return this.repository.findAll();
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.repository.findById(id);
  }
}
