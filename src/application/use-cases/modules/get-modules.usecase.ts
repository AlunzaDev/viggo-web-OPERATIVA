import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";

export interface GetModulesUseCase {
    execute(projectId?: string): Promise<ModuleEntity[]>;
}

export class GetModules implements GetModulesUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(projectId?: string): Promise<ModuleEntity[]> {
        return this.repository.getAll(projectId);
    }
}
