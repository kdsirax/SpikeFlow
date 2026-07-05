import type { Organization } from "./organization.types.js";

export interface IOrganizationRepository {
  create(organization: Organization): Promise<Organization>;
  findAll(): Promise<Organization[]>;
  findById(id: string): Promise<Organization | undefined>;
}

export class MemoryOrganizationRepository implements IOrganizationRepository {
  private organizations: Organization[] = [];

  async create(organization: Organization): Promise<Organization> {
    this.organizations.push(organization);
    return organization;
  }

  async findAll(): Promise<Organization[]> {
    return this.organizations;
  }

  async findById(id: string): Promise<Organization | undefined> {
    return this.organizations.find((org) => org.id === id);
  }
}
