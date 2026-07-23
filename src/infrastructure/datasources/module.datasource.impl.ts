import { ModuleDatasource } from "../../domain/datasources/module.datasource";
import { ModuleEntity } from "../../domain/entities/module.entity";
import { api } from "../http/axios.instance";
import { CreateModuleDto } from "../dtos/module/create-module.dto";
import { UpdateModuleDto } from "../dtos/module/update-module.dto";

type ApiErrorPayload = {
    response?: {
        data?: {
            error?: string;
            message?: string;
        };
    };
};

const getApiErrorMessage = (error: unknown): string | undefined => {
    if (typeof error !== "object" || error === null) return undefined;
    const parsedError = error as ApiErrorPayload;
    return parsedError.response?.data?.error || parsedError.response?.data?.message;
};

const resolveModulePayload = (data: { modulo?: unknown } | unknown): Record<string, unknown> => {
    const source =
        typeof data === "object" && data !== null && "modulo" in data
            ? (data as { modulo?: unknown }).modulo ?? data
            : data;

    if (typeof source === "object" && source !== null) {
        return source as Record<string, unknown>;
    }

    throw new Error("Respuesta de modulo invalida");
};

export class ModuleDatasourceImpl implements ModuleDatasource {
    async getAll(projectId?: string): Promise<ModuleEntity[]> {
        try {
            const query = projectId ? { params: { proyecto: projectId } } : undefined;
            const { data } = await api.get<{ modulos?: unknown[] } | unknown[]>("/api/modulos", query);
            const modulesList = Array.isArray(data) ? data : (data.modulos ?? []);
            return modulesList.map((item) => ModuleEntity.fromObject(resolveModulePayload(item)));
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
            return ModuleEntity.fromObject(resolveModulePayload(data));
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
            return ModuleEntity.fromObject(resolveModulePayload(data));
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
            return ModuleEntity.fromObject(resolveModulePayload(data));
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
            return ModuleEntity.fromObject(resolveModulePayload(data));
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
            return ModuleEntity.fromObject(resolveModulePayload(data));
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
            return ModuleEntity.fromObject(resolveModulePayload(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo desvincular el modulo con id ${id}`);
        }
    }
}
