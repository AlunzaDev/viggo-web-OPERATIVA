import { ParkingEntity } from "../entities/parking.entity";
import { CreateParkingDto } from "../../application/dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../../application/dtos/parking/update-parking.dto";

export type PaginationParams = {
    page?: number;
    limit?: number;
};

export type PaginatedParkingResult = {
    items: ParkingEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export abstract class ParkingDatasource {
    abstract getAll(): Promise<ParkingEntity[]>;
    abstract getPage(params: PaginationParams): Promise<PaginatedParkingResult>;
    abstract create(createParkingDto: CreateParkingDto): Promise<ParkingEntity>;
    abstract updateById(updateParkingDto: UpdateParkingDto): Promise<ParkingEntity>;
    abstract deleteById(id: string): Promise<void>;
}
