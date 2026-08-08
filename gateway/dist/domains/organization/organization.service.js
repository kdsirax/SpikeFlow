import { logger } from "../../shared/logger/logger.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
export class OrganizationService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async createOrganization(input) {
        const existing = await this.repository.findByName(input.name);
        if (existing) {
            throw new ValidationError("Organization name already exists");
        }
        const created = await this.repository.create(input);
        logger.info({ organizationId: created.id, name: created.name }, "Organization created");
        return created;
    }
    async getOrganizations() {
        return this.repository.findAll();
    }
    async getOrganizationById(id) {
        return this.repository.findById(id);
    }
}
//# sourceMappingURL=organization.service.js.map