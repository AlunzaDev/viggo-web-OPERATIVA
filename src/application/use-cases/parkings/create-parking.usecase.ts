import { ParkingEntity } from "../../../domain/entities/parking.entity";
import { ParkingRepository } from "../../../domain/repositories/parking.repository";
import { CreateParkingDto } from "../../../application/dtos/parking/create-parking.dto";

export interface CreateParkingUseCase {
    execute(dto: CreateParkingDto): Promise<ParkingEntity>;
}

export class CreateParking implements CreateParkingUseCase {
    private readonly repository: ParkingRepository;

    constructor(repository: ParkingRepository) {
        this.repository = repository;
    }

    execute(dto: CreateParkingDto): Promise<ParkingEntity> {
        return this.repository.create(dto);
    }
}
