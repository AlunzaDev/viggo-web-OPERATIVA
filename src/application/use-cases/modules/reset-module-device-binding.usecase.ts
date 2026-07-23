import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";

export interface ResetModuleDeviceBindingUseCase {
    execute(id: string): Promise<ModuleEntity>;
}

export class ResetModuleDeviceBinding implements ResetModuleDeviceBindingUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string): Promise<ModuleEntity> {
        return this.repository.resetDeviceBinding(id);
    }
}
