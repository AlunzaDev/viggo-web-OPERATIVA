import { ModuleEntity } from "../../../domain/entities/module.entity";
import { ModuleRepository } from "../../../domain/repositories/module.repository";
import { UpdateModuleDto } from "../../../application/dtos/module/update-module.dto";

export interface UpdateModuleUseCase {
    execute(dto: UpdateModuleDto): Promise<ModuleEntity>;
}

export class UpdateModule implements UpdateModuleUseCase {
    private readonly repository: ModuleRepository;

    constructor(repository: ModuleRepository) {
        this.repository = repository;
    }

    execute(dto: UpdateModuleDto): Promise<ModuleEntity> {
        return this.repository.updateById(dto);
    }
}
