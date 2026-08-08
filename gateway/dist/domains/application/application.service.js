import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { logger } from "../../shared/logger/logger.js";
export class ApplicationService {
    repository;
    organizationRepository;
    constructor(repository, organizationRepository) {
        this.repository = repository;
        this.organizationRepository = organizationRepository;
    }
    async createApplication(input) {
        const organization = await this.organizationRepository.findById(input.organizationId);
        if (!organization) {
            throw new NotFoundError("Organization not found");
        }
        const created = await this.repository.create(input);
        logger.info({ applicationId: created.id, name: created.name }, "Application created");
        return created;
    }
    async getApplications() {
        return this.repository.findAll();
    }
    async getApplicationById(id) {
        return this.repository.findById(id);
    }
}
//# sourceMappingURL=application.service.js.map