import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";

export interface RejectModuleDeviceBindingUseCase {
    execute(id: string, fingerprint?: string): Promise<ModuleEntity>;
}

export class RejectModuleDeviceBinding implements RejectModuleDeviceBindingUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string, fingerprint?: string): Promise<ModuleEntity> {
        return this.repository.rejectDeviceBinding(id, fingerprint);
    }
}
