import { ModuleDatasource } from "../../domain/datasources/module.datasource";
import type {
    ModuleRemoteSupportSessionUrl,
    PaginatedModuleResult,
} from "../../domain/datasources/module.datasource";
import { ModuleEntity } from "../../domain/entities/module.entity";
import { api } from "../http/axios.instance";
import {
    getApiErrorMessage,
} from "../http/api-contracts";
import { CreateModuleDto } from "../../application/dtos/module/create-module.dto";
import { UpdateModuleDto } from "../../application/dtos/module/update-module.dto";
import {
    normalizeModuleCollection,
    normalizeModulePage,
    normalizeModuleRecord,
} from "./module.contract";

export class ModuleDatasourceImpl implements ModuleDatasource {
    async getAll(projectId?: string): Promise<ModuleEntity[]> {
        try {
            const query = projectId ? { params: { proyecto: projectId } } : undefined;
            const { data } = await api.get<{ modulos?: unknown[] } | unknown[]>("/api/modulos", query);
            const modulesList = normalizeModuleCollection(data);
            return modulesList.map((item) => ModuleEntity.fromObject(item));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error("Ocurrio un error inesperado al listar modulos");
        }
    }

    async getPage(params: {
        page?: number;
        limit?: number;
        projectId?: string;
    }): Promise<PaginatedModuleResult> {
        try {
            const { data } = await api.get<{
                modulos?: unknown[];
                total?: unknown;
                page?: unknown;
                limit?: unknown;
                totalPages?: unknown;
            }>("/api/modulos", {
                params: {
                    proyecto: params.projectId,
                    page: params.page,
                    limit: params.limit,
                },
            });

            const pageResult = normalizeModulePage(
                data,
                params.page ?? 1,
                params.limit ?? 20,
            );
            const items = pageResult.items.map((item) => ModuleEntity.fromObject(item));

            return {
                items,
                total: pageResult.total,
                page: pageResult.page,
                limit: pageResult.limit,
                totalPages: pageResult.totalPages,
            };
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error("Ocurrio un error inesperado al listar modulos");
        }
    }

    async create(createModuleDto: CreateModuleDto): Promise<ModuleEntity> {
        try {
            const { data } = await api.post<{ modulo?: unknown } | unknown>("/api/modulos", createModuleDto);
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error("No se pudo crear el modulo");
        }
    }

    async updateById(updateModuleDto: UpdateModuleDto): Promise<ModuleEntity> {
        try {
            const { id, ...rest } = updateModuleDto;
            const { data } = await api.patch<{ modulo?: unknown } | unknown>(`/api/modulos/${id}`, rest);
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo actualizar el modulo con id ${updateModuleDto.id}`);
        }
    }

    async deleteById(id: string): Promise<void> {
        try {
            await api.delete(`/api/modulos/${id}`);
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo eliminar el modulo con id ${id}`);
        }
    }

    async approveDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity> {
        try {
            const { data } = await api.patch<{ modulo?: unknown } | unknown>(
                `/api/modulos/${id}/device-binding/approve`,
                fingerprint ? { fingerprint } : {},
            );
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo aprobar la huella del modulo con id ${id}`);
        }
    }

    async rejectDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity> {
        try {
            const { data } = await api.patch<{ modulo?: unknown } | unknown>(
                `/api/modulos/${id}/device-binding/reject`,
                fingerprint ? { fingerprint } : {},
            );
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo rechazar la huella del modulo con id ${id}`);
        }
    }

    async reopenDeviceBinding(id: string, fingerprint?: string): Promise<ModuleEntity> {
        try {
            const { data } = await api.patch<{ modulo?: unknown } | unknown>(
                `/api/modulos/${id}/device-binding/pending`,
                fingerprint ? { fingerprint } : {},
            );
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo marcar la huella como pendiente en el modulo con id ${id}`);
        }
    }

    async resetDeviceBinding(id: string): Promise<ModuleEntity> {
        try {
            const { data } = await api.patch<{ modulo?: unknown } | unknown>(
                `/api/modulos/${id}/device-binding/reset`,
                {},
            );
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo desvincular el modulo con id ${id}`);
        }
    }

    async resolveRemoteSupportDevice(id: string): Promise<ModuleEntity> {
        try {
            const { data } = await api.post<{
                modulo?: unknown;
                resolved?: unknown;
                error?: unknown;
            }>(
                `/api/modulos/${id}/remote-support/resolve-device`,
                {},
            );
            return ModuleEntity.fromObject(normalizeModuleRecord(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo resolver soporte remoto para el modulo con id ${id}`);
        }
    }

    async createRemoteSupportSessionUrl(
        id: string,
        viewMode = 10,
    ): Promise<ModuleRemoteSupportSessionUrl> {
        try {
            const { data } = await api.post<ModuleRemoteSupportSessionUrl>(
                `/api/modulos/${id}/remote-support/session-url`,
                { viewMode },
            );
            return data;
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo crear sesion de soporte remoto para el modulo con id ${id}`);
        }
    }
}
