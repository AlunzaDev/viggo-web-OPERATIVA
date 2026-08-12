import { ParkingEntity } from "../entities/parking.entity";
import { CreateParkingDto } from "../../application/dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../../application/dtos/parking/update-parking.dto";
import type { PaginatedParkingResult, PaginationParams } from "../datasources/parking.datasource";

export abstract class ParkingRepository {
    abstract getAll(): Promise<ParkingEntity[]>;
    abstract getPage(params: PaginationParams): Promise<PaginatedParkingResult>;
    abstract create(createParkingDto: CreateParkingDto): Promise<ParkingEntity>;
    abstract updateById(updateParkingDto: UpdateParkingDto): Promise<ParkingEntity>;
    abstract deleteById(id: string): Promise<void>;
}
