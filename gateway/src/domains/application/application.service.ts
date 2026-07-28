import type { IApplicationRepository } from "./application.repository.js";
import type { IOrganizationRepository } from "../organization/organization.repository.js";
import type { CreateApplicationInput, Application } from "./application.types.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";

export class ApplicationService {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async createApplication(input: CreateApplicationInput): Promise<Application> {
    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    const created = await this.repository.create(input);
    logger.info({ applicationId: created.id, name: created.name }, "Application created");
    return created;
  }

  async getApplications(): Promise<Application[]> {
    return this.repository.findAll();
  }

  async getApplicationById(id: string): Promise<Application | null> {
    return this.repository.findById(id);
  }
}
