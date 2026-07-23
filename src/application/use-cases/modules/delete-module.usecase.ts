import { ModuleRepository } from "../../../domain/repositories/module.repository";

export interface DeleteModuleUseCase {
    execute(id: string): Promise<void>;
}

export class DeleteModule implements DeleteModuleUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string): Promise<void> {
        return this.repository.deleteById(id);
    }
}
