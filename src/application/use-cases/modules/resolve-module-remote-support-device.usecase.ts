import { ModuleRepository } from "../../../domain/repositories/module.repository";

export class ResolveModuleRemoteSupportDevice {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string) {
        return this.repository.resolveRemoteSupportDevice(id);
    }
}
