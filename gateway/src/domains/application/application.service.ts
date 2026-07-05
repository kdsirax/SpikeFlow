import { randomUUID } from "crypto";
import type { IApplicationRepository } from "./application.repository.js";
import type { IOrganizationRepository } from "../organization/organization.repository.js";
import type { CreateApplicationInput, Application } from "./application.types.js";

export class ApplicationService {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async createApplication(input: CreateApplicationInput): Promise<Application> {
    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const now = new Date();
    const application: Application = {
      id: randomUUID(),
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    return this.repository.create(application);
  }

  async getApplications(): Promise<Application[]> {
    return this.repository.findAll();
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    return this.repository.findById(id);
  }
}
