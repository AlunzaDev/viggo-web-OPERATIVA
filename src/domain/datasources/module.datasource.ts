import { ModuleEntity } from "../entities/module.entity";
import { CreateModuleDto } from "../../infrastructure/dtos/module/create-module.dto";
import { UpdateModuleDto } from "../../infrastructure/dtos/module/update-module.dto";
import type { PaginationParams } from "./parking.datasource";

export type PaginatedModuleResult = {
    items: ModuleEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export abstract class ModuleDatasource {
    abstract getAll(projectId?: string): Promise<ModuleEntity[]>;
    abstract getPage(params: PaginationParams & { projectId?: string }): Promise<PaginatedModuleResult>;
    abstract create(createModuleDto: CreateModuleDto): Promise<ModuleEntity>;
    abstract updateById(updateModuleDto: UpdateModuleDto): Promise<ModuleEntity>;
    abstract deleteById(id: string): Promise<void>;
    abstract approveDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract rejectDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract reopenDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity>;
    abstract resetDeviceBinding(id: string): Promise<ModuleEntity>;
    abstract resolveMeshCentralDevice(id: string): Promise<ModuleEntity>;
}
