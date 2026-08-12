import { useCallback, useEffect, useState } from "react";
import {
    approveModuleDeviceBindingUseCase,
    createModuleRemoteSupportSessionUrlUseCase,
    createModuleUseCase,
    deleteModuleUseCase,
    getModulesPageUseCase,
    rejectModuleDeviceBindingUseCase,
    reopenModuleDeviceBindingUseCase,
    resetModuleDeviceBindingUseCase,
    resolveModuleRemoteSupportDeviceUseCase,
    updateModuleUseCase,
} from "../../../application/dependencies/module.dependencies";
import { CreateModuleDto } from "../../../application/dtos/module/create-module.dto";
import { UpdateModuleDto } from "../../../application/dtos/module/update-module.dto";
import { ModuleEntity, type ModuleType } from "../../../domain/entities/module.entity";
export type ModuleFormPayload = {
    nombre: string;
    proyecto: string;
    tipo: ModuleType;
    identificador: string;
    descripcion?: string;
    estado?: boolean;
};

export function useModules(projectId?: string) {
    const [modules, setModules] = useState<ModuleEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBindingActionRunning, setIsBindingActionRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const getErrorMessage = (errorValue: unknown, fallback: string) =>
        errorValue instanceof Error ? errorValue.message : fallback;

    const fetchModules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getModulesPageUseCase.execute({ projectId, page, limit: pageSize });
            setModules(result.items);
            setTotalItems(result.total);
            setTotalPages(Math.max(1, result.totalPages));
        } catch (err: unknown) {
            setError(getErrorMessage(err, "No se pudieron cargar los modulos"));
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, projectId]);

    useEffect(() => {
        void fetchModules();
    }, [fetchModules]);

    const goToPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const changePageSize = (size: number) => {
        if (size > 0) {
            setPageSize(size);
            setPage(1);
        }
    };

    const createModule = async (payload: ModuleFormPayload) => {
        setIsSaving(true);
        setError(null);
        try {
            const [errorDto, dto] = CreateModuleDto.create(payload);
            if (errorDto || !dto) throw new Error(errorDto || "Datos invalidos");

            const newModule = await createModuleUseCase.execute(dto);
            void fetchModules();
            return newModule;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo crear el modulo");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateModule = async (id: string, payload: Partial<ModuleFormPayload>) => {
        setIsUpdating(true);
        setError(null);
        try {
            const [errorDto, dto] = UpdateModuleDto.create({ id, ...payload });
            if (errorDto || !dto) throw new Error(errorDto || "Datos invalidos");

            const updated = await updateModuleUseCase.execute(dto);
            void fetchModules();
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo actualizar el modulo");
            setError(message);
            throw new Error(message);
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteModule = async (id: string) => {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteModuleUseCase.execute(id);
            void fetchModules();
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo eliminar el modulo");
            setError(message);
            throw new Error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const replaceModule = (updatedModule: ModuleEntity) => {
        setModules((prev) =>
            prev.map((module) => (module.id === updatedModule.id ? updatedModule : module)),
        );
    };

    const approveDeviceBinding = async (id: string, fingerprint?: string) => {
        setIsBindingActionRunning(true);
        setError(null);
        try {
            const updated = await approveModuleDeviceBindingUseCase.execute(id, fingerprint);
            replaceModule(updated);
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo aprobar la huella");
            setError(message);
            throw new Error(message);
        } finally {
            setIsBindingActionRunning(false);
        }
    };

    const rejectDeviceBinding = async (id: string, fingerprint?: string) => {
        setIsBindingActionRunning(true);
        setError(null);
        try {
            const updated = await rejectModuleDeviceBindingUseCase.execute(id, fingerprint);
            replaceModule(updated);
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo rechazar la huella");
            setError(message);
            throw new Error(message);
        } finally {
            setIsBindingActionRunning(false);
        }
    };

    const resetDeviceBinding = async (id: string) => {
        setIsBindingActionRunning(true);
        setError(null);
        try {
            const updated = await resetModuleDeviceBindingUseCase.execute(id);
            replaceModule(updated);
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo desvincular el modulo");
            setError(message);
            throw new Error(message);
        } finally {
            setIsBindingActionRunning(false);
        }
    };

    const resolveRemoteSupportDevice = async (id: string) => {
        setIsBindingActionRunning(true);
        setError(null);
        try {
            const updated = await resolveModuleRemoteSupportDeviceUseCase.execute(id);
            replaceModule(updated);
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo resolver soporte remoto");
            setError(message);
            throw new Error(message);
        } finally {
            setIsBindingActionRunning(false);
        }
    };

    const createRemoteSupportSessionUrl = async (id: string, viewMode?: number) => {
        setIsBindingActionRunning(true);
        setError(null);
        try {
            return await createModuleRemoteSupportSessionUrlUseCase.execute(id, viewMode);
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo abrir soporte remoto");
            setError(message);
            throw new Error(message);
        } finally {
            setIsBindingActionRunning(false);
        }
    };

    const reopenDeviceBinding = async (id: string, fingerprint?: string) => {
        setIsBindingActionRunning(true);
        setError(null);
        try {
            const updated = await reopenModuleDeviceBindingUseCase.execute(id, fingerprint);
            replaceModule(updated);
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo marcar la huella como pendiente");
            setError(message);
            throw new Error(message);
        } finally {
            setIsBindingActionRunning(false);
        }
    };

    return {
        modules,
        isLoading,
        isSaving,
        isUpdating,
        isDeleting,
        isBindingActionRunning,
        error,
        page,
        pageSize,
        totalItems,
        totalPages,
        goToPage,
        changePageSize,
        fetchModules,
        createModule,
        updateModule,
        deleteModule,
        approveDeviceBinding,
        rejectDeviceBinding,
        reopenDeviceBinding,
        resetDeviceBinding,
        resolveRemoteSupportDevice,
        createRemoteSupportSessionUrl,
    };
}
