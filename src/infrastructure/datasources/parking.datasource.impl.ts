import { ParkingDatasource } from "../../domain/datasources/parking.datasource";
import type {
    PaginatedParkingResult,
    PaginationParams,
} from "../../domain/datasources/parking.datasource";
import { ParkingEntity } from "../../domain/entities/parking.entity";
import { api } from "../http/axios.instance";
import { CreateParkingDto } from "../dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../dtos/parking/update-parking.dto";

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

const resolveParkingPayload = (data: { proyecto?: unknown } | unknown): Record<string, unknown> => {
    const source =
        typeof data === "object" && data !== null && "proyecto" in data
            ? (data as { proyecto?: unknown }).proyecto ?? data
            : data;

    if (typeof source === "object" && source !== null) {
        return source as Record<string, unknown>;
    }

    throw new Error("Respuesta de proyecto invalida");
};

export class ParkingDatasourceImpl implements ParkingDatasource {
    async getAll(): Promise<ParkingEntity[]> {
        try {
            const { data } = await api.get<{ proyectos?: unknown[] } | unknown[]>("/api/proyectos");
            const parkingsList = Array.isArray(data) ? data : (data.proyectos ?? []);
            return parkingsList.map((parking) => ParkingEntity.fromObject(resolveParkingPayload(parking)));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error("Ocurrio un error inesperado al listar proyectos");
        }
    }

    async getPage(params: PaginationParams): Promise<PaginatedParkingResult> {
        try {
            const { data } = await api.get<{
                proyectos?: unknown[];
                total?: unknown;
                page?: unknown;
                limit?: unknown;
                totalPages?: unknown;
            }>("/api/proyectos", {
                params: {
                    page: params.page,
                    limit: params.limit,
                },
            });

            const items = Array.isArray(data.proyectos)
                ? data.proyectos.map((parking) =>
                      ParkingEntity.fromObject(resolveParkingPayload(parking)),
                  )
                : [];

            return {
                items,
                total: Number(data.total ?? items.length),
                page: Number(data.page ?? params.page ?? 1),
                limit: Number(data.limit ?? params.limit ?? Math.max(items.length, 1)),
                totalPages: Number(data.totalPages ?? 1),
            };
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error("Ocurrio un error inesperado al listar proyectos");
        }
    }

    async create(createParkingDto: CreateParkingDto): Promise<ParkingEntity> {
        try {
            const { data } = await api.post<{ proyecto?: unknown } | unknown>("/api/proyectos", createParkingDto);
            return ParkingEntity.fromObject(resolveParkingPayload(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error("No se pudo crear el proyecto");
        }
    }

    async updateById(updateParkingDto: UpdateParkingDto): Promise<ParkingEntity> {
        try {
            const { id, ...rest } = updateParkingDto;
            const { data } = await api.patch<{ proyecto?: unknown } | unknown>(`/api/proyectos/${id}`, rest);
            return ParkingEntity.fromObject(resolveParkingPayload(data));
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo actualizar el proyecto con id ${updateParkingDto.id}`);
        }
    }

    async deleteById(id: string): Promise<void> {
        try {
            await api.delete(`/api/proyectos/${id}`);
        } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error);
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(`No se pudo eliminar el proyecto con id ${id}`);
        }
    }
}
