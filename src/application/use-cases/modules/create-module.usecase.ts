import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";
import { CreateModuleDto } from "../../../application/dtos/module/create-module.dto";

export interface CreateModuleUseCase {
    execute(dto: CreateModuleDto): Promise<ModuleEntity>;
}

export class CreateModule implements CreateModuleUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(dto: CreateModuleDto): Promise<ModuleEntity> {
        return this.repository.create(dto);
    }
}
