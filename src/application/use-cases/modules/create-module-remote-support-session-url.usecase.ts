import { ModuleRepository } from "../../../domain/repositories/module.repository";

export class CreateModuleRemoteSupportSessionUrl {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(id: string, viewMode?: number) {
        return this.repository.createRemoteSupportSessionUrl(id, viewMode);
    }
}
