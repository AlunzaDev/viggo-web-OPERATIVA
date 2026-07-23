import { ParkingEntity } from "../../../domain/entities/parking.entity";
import { ParkingRepository } from "../../../domain/repositories/parking.repository";

export interface GetParkingsUseCase {
    execute(): Promise<ParkingEntity[]>;
}

export class GetParkings implements GetParkingsUseCase {
    private readonly repository: ParkingRepository;

    constructor(repository: ParkingRepository) {
        this.repository = repository;
    }

    execute(): Promise<ParkingEntity[]> {
        return this.repository.getAll();
    }
}
