import { ParkingDatasource } from "../../domain/datasources/parking.datasource";
import type {
    PaginatedParkingResult,
    PaginationParams,
} from "../../domain/datasources/parking.datasource";
import { ParkingEntity } from "../../domain/entities/parking.entity";
import { api } from "../http/axios.instance";
import { getApiErrorMessage } from "../http/api-contracts";
import { CreateParkingDto } from "../../application/dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../../application/dtos/parking/update-parking.dto";
import {
    normalizeProjectCollection,
    normalizeProjectPage,
    normalizeProjectRecord,
} from "./parking.contract";

export class ParkingDatasourceImpl implements ParkingDatasource {
    async getAll(): Promise<ParkingEntity[]> {
        try {
            const { data } = await api.get<{ proyectos?: unknown[] } | unknown[]>("/api/proyectos");
            return normalizeProjectCollection(data).map((parking) =>
                ParkingEntity.fromObject(parking),
            );
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

            const pageResult = normalizeProjectPage(
                data,
                params.page ?? 1,
                params.limit ?? 20,
            );
            const items = pageResult.items.map((parking) =>
                ParkingEntity.fromObject(parking),
            );

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
            throw new Error("Ocurrio un error inesperado al listar proyectos");
        }
    }

    async create(createParkingDto: CreateParkingDto): Promise<ParkingEntity> {
        try {
            const { data } = await api.post<{ proyecto?: unknown } | unknown>("/api/proyectos", createParkingDto);
            return ParkingEntity.fromObject(normalizeProjectRecord(data));
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
            return ParkingEntity.fromObject(normalizeProjectRecord(data));
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
