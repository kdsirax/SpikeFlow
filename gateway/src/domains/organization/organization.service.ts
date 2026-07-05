import { randomUUID } from "crypto";
import type { IOrganizationRepository } from "./organization.repository.js";
import type { CreateOrganizationInput, Organization } from "./organization.types.js";

export class OrganizationService {
  constructor(private readonly repository: IOrganizationRepository) {}

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const now = new Date();
    const organization: Organization = {
      id: randomUUID(),
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),

    };
    return this.repository.create(organization);
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.repository.findAll();
  }

  async getOrganizationById(id: string): Promise<Organization | undefined> {
    return this.repository.findById(id);
  }
}
