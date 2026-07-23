import { ParkingDatasource } from "../../domain/datasources/parking.datasource";
import { ParkingEntity } from "../../domain/entities/parking.entity";
import { ParkingRepository } from "../../domain/repositories/parking.repository";
import { CreateParkingDto } from "../dtos/parking/create-parking.dto";
import { UpdateParkingDto } from "../dtos/parking/update-parking.dto";

export class ParkingRepositoryImpl implements ParkingRepository {
    private readonly datasource: ParkingDatasource;

    constructor(datasource: ParkingDatasource) {
        this.datasource = datasource;
    }

    getAll(): Promise<ParkingEntity[]> {
        return this.datasource.getAll();
    }
    create(createParkingDto: CreateParkingDto): Promise<ParkingEntity> {
        return this.datasource.create(createParkingDto);
    }
    updateById(updateParkingDto: UpdateParkingDto): Promise<ParkingEntity> {
        return this.datasource.updateById(updateParkingDto);
    }
    deleteById(id: string): Promise<void> {
        return this.datasource.deleteById(id);
    }
}
