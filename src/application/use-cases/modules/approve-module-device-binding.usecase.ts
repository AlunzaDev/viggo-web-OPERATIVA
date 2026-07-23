import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";

export interface ApproveModuleDeviceBindingUseCase {
    execute(id: string, fingerprint?: string): Promise<ModuleEntity>;
}

export class ApproveModuleDeviceBinding implements ApproveModuleDeviceBindingUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string, fingerprint?: string): Promise<ModuleEntity> {
        return this.repository.approveDeviceBinding(id, fingerprint);
    }
}
