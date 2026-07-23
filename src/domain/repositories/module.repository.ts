import { ModuleEntity } from "../entities/module.entity";
import { CreateModuleDto } from "../../infrastructure/dtos/module/create-module.dto";
import { UpdateModuleDto } from "../../infrastructure/dtos/module/update-module.dto";

export abstract class ModuleRepository {
    abstract getAll(projectId?: string): Promise<ModuleEntity[]>;
    abstract create(createModuleDto: CreateModuleDto): Promise<ModuleEntity>;
    abstract updateById(updateModuleDto: UpdateModuleDto): Promise<ModuleEntity>;
    abstract deleteById(id: string): Promise<void>;
    abstract approveDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract rejectDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract reopenDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract resetDeviceBinding(id: string): Promise<ModuleEntity>;
}
