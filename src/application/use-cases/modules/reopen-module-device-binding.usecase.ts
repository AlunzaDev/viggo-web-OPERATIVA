import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";

export interface ReopenModuleDeviceBindingUseCase {
    execute(id: string, fingerprint?: string): Promise<ModuleEntity>;
}

export class ReopenModuleDeviceBinding implements ReopenModuleDeviceBindingUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string, fingerprint?: string): Promise<ModuleEntity> {
        return this.repository.reopenDeviceBinding(id, fingerprint);
    }
}
