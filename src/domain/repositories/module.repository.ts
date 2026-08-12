import { ModuleEntity } from "../entities/module.entity";
import { CreateModuleDto } from "../../application/dtos/module/create-module.dto";
import { UpdateModuleDto } from "../../application/dtos/module/update-module.dto";
import type { ModuleRemoteSupportSessionUrl, PaginatedModuleResult, PaginationParams } from "../datasources/module.datasource";

export abstract class ModuleRepository {
    abstract getAll(projectId?: string): Promise<ModuleEntity[]>;
    abstract getPage(params: PaginationParams & { projectId?: string }): Promise<PaginatedModuleResult>;
    abstract create(createModuleDto: CreateModuleDto): Promise<ModuleEntity>;
    abstract updateById(updateModuleDto: UpdateModuleDto): Promise<ModuleEntity>;
    abstract deleteById(id: string): Promise<void>;
    abstract approveDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract rejectDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract reopenDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract resetDeviceBinding(id: string): Promise<ModuleEntity>;
    abstract resolveRemoteSupportDevice(id: string): Promise<ModuleEntity>;
    abstract createRemoteSupportSessionUrl(id: string, viewMode?: number): Promise<ModuleRemoteSupportSessionUrl>;
}
