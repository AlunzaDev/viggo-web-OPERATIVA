import { ParkingEntity } from "../entities/parking.entity";
import { CreateParkingDto } from "../../infrastructure/dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../../infrastructure/dtos/parking/update-parking.dto";

export abstract class ParkingDatasource {
    abstract getAll(): Promise<ParkingEntity[]>;
    abstract create(createParkingDto: CreateParkingDto): Promise<ParkingEntity>;
    abstract updateById(updateParkingDto: UpdateParkingDto): Promise<ParkingEntity>;
    abstract deleteById(id: string): Promise<void>;
}
