import { useCallback, useEffect, useState } from "react";
import { ParkingEntity } from "../../../domain/entities/parking.entity";
import { ParkingDatasourceImpl } from "../../../infrastructure/datasources/parking.datasource.impl";
import { ParkingRepositoryImpl } from "../../../infrastructure/repositories/parking.repository.impl";
import { CreateParking } from "../../../application/use-cases/parkings/create-parking.usecase";
import { UpdateParking } from "../../../application/use-cases/parkings/update-parking.usecase";
import { DeleteParking } from "../../../application/use-cases/parkings/delete-parking.usecase";
import { CreateParkingDto } from "../../../infrastructure/dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../../../infrastructure/dtos/parking/update-parking.dto";

const datasource = new ParkingDatasourceImpl();
const repository = new ParkingRepositoryImpl(datasource);

const createParkingUseCase = new CreateParking(repository);
const updateParkingUseCase = new UpdateParking(repository);
const deleteParkingUseCase = new DeleteParking(repository);

export type ProjectFormPayload = {
    nombre: string;
    ciudad: string;
    identificador: string;
    coordinates?: number[];
    latitude?: string | number;
    longitude?: string | number;
    descripcion?: string;
    img?: string;
    estado?: boolean;
};

export function useParkings() {
    const [parkings, setParkings] = useState<ParkingEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const getErrorMessage = (error: unknown, fallback: string) =>
        error instanceof Error ? error.message : fallback;

    const fetchParkings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await datasource.getPage({ page, limit: pageSize });
            setParkings(result.items);
            setTotalItems(result.total);
            setTotalPages(Math.max(1, result.totalPages));
        } catch (err: unknown) {
            setError(getErrorMessage(err, "No se pudieron cargar los proyectos"));
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        void fetchParkings();
    }, [fetchParkings]);

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

    const createParking = async (payload: ProjectFormPayload) => {
        setIsSaving(true);
        setError(null);
        try {
            const [errorDto, dto] = CreateParkingDto.create(payload);
            if (errorDto || !dto) throw new Error(errorDto || "Datos invalidos");

            const newParking = await createParkingUseCase.execute(dto);
            void fetchParkings();
            return newParking;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo crear el proyecto");
            setError(message);
            throw new Error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateParking = async (id: string, payload: Partial<ProjectFormPayload>) => {
        setIsUpdating(true);
        setError(null);
        try {
            const [errorDto, dto] = UpdateParkingDto.create({ id, ...payload });
            if (errorDto || !dto) throw new Error(errorDto || "Datos invalidos");

            const updated = await updateParkingUseCase.execute(dto);
            void fetchParkings();
            return updated;
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo actualizar el proyecto");
            setError(message);
            throw new Error(message);
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteParking = async (id: string) => {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteParkingUseCase.execute(id);
            void fetchParkings();
        } catch (err: unknown) {
            const message = getErrorMessage(err, "No se pudo eliminar el proyecto");
            setError(message);
            throw new Error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        parkings,
        isLoading,
        isSaving,
        isUpdating,
        isDeleting,
        error,
        page,
        pageSize,
        totalItems,
        totalPages,
        goToPage,
        changePageSize,
        fetchParkings,
        createParking,
        updateParking,
        deleteParking,
    };
}
