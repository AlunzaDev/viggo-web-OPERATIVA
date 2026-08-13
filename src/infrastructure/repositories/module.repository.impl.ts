import { ModuleDatasource, type ModuleRemoteSupportSessionUrl, type PaginatedModuleResult, type PaginationParams } from "../../domain/datasources/module.datasource";
import { ModuleEntity } from "../../domain/entities/module.entity";
import { ModuleRepository } from "../../domain/repositories/module.repository";
import { CreateModuleDto } from "../../application/dtos/module/create-module.dto";
import { UpdateModuleDto } from "../../application/dtos/module/update-module.dto";

export class ModuleRepositoryImpl implements ModuleRepository {
    private readonly datasource: ModuleDatasource;

    constructor(datasource: ModuleDatasource) {
        this.datasource = datasource;
    }

    getAll(projectId?: string): Promise<ModuleEntity[]> {
        return this.datasource.getAll(projectId);
    }

    getPage(params: PaginationParams & { projectId?: string }): Promise<PaginatedModuleResult> {
        return this.datasource.getPage(params);
    }

    create(createModuleDto: CreateModuleDto): Promise<ModuleEntity> {
        return this.datasource.create(createModuleDto);
    }

    updateById(updateModuleDto: UpdateModuleDto): Promise<ModuleEntity> {
        return this.datasource.updateById(updateModuleDto);
    }

    deleteById(id: string): Promise<void> {
        return this.datasource.deleteById(id);
    }

    approveDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity> {
        return this.datasource.approveDeviceBinding(id, fingerprint);
    }

    rejectDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity> {
        return this.datasource.rejectDeviceBinding(id, fingerprint);
    }

    reopenDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity> {
        return this.datasource.reopenDeviceBinding(id, fingerprint);
    }

    resetDeviceBinding(id: string): Promise<ModuleEntity> {
        return this.datasource.resetDeviceBinding(id);
    }

    resolveRemoteSupportDevice(id: string): Promise<ModuleEntity> {
        return this.datasource.resolveRemoteSupportDevice(id);
    }

    createRemoteSupportSessionUrl(id: string, viewMode?: number): Promise<ModuleRemoteSupportSessionUrl> {
        return this.datasource.createRemoteSupportSessionUrl(id, viewMode);
    }

    createProjectRemoteSupportSessionUrl(projectId: string): Promise<ModuleRemoteSupportSessionUrl> {
        return this.datasource.createProjectRemoteSupportSessionUrl(projectId);
    }
}
