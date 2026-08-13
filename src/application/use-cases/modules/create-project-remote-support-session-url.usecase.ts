import type { ModuleRepository } from "../../../domain/repositories/module.repository";

export class CreateProjectRemoteSupportSessionUrl {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(projectId: string) {
        return this.repository.createProjectRemoteSupportSessionUrl(projectId);
    }
}
