import type { IApplicationRepository } from "./application.repository.js";
import type { IOrganizationRepository } from "../organization/organization.repository.js";
import type { CreateApplicationInput, UpdateApplicationInput, Application } from "./application.types.js";
import { logger } from "../../shared/logger/logger.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import { NotFoundError } from "../../shared/errors/NotFoundError.js";

export class ApplicationService {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async createApplication(input: CreateApplicationInput): Promise<Application> {
    const org = await this.organizationRepository.findById(input.organizationId);
    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    const existing = await this.repository.findByName(input.name);
    if (existing) {
      throw new ValidationError("Application name already exists");
    }

    const created = await this.repository.create(input);
    logger.info({ applicationId: created.id, name: created.name }, "Application created");
    return created;
  }

  async updateApplication(id: string, input: UpdateApplicationInput): Promise<Application> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Application not found");
    }

    if (input.organizationId) {
      const org = await this.organizationRepository.findById(input.organizationId);
      if (!org) {
        throw new NotFoundError("Organization not found");
      }
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.repository.findByName(input.name);
      if (duplicate && duplicate.id !== id) {
        throw new ValidationError("Application name already exists");
      }
    }

    const updated = await this.repository.update(id, input);
    logger.info({ applicationId: updated.id, name: updated.name }, "Application updated");
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Application not found");
    }

    const deleted = await this.repository.delete(id);
    logger.info({ applicationId: id }, "Application deleted");
    return deleted;
  }

  async getApplications(): Promise<Application[]> {
    return this.repository.findAll();
  }

  async getApplicationById(id: string): Promise<Application | null> {
    return this.repository.findById(id);
  }
}
