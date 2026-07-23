import { ParkingRepository } from "../../../domain/repositories/parking.repository";

export interface DeleteParkingUseCase {
    execute(id: string): Promise<void>;
}

export class DeleteParking implements DeleteParkingUseCase {
    private readonly repository: ParkingRepository;

    constructor(repository: ParkingRepository) {
        this.repository = repository;
    }

    execute(id: string): Promise<void> {
        return this.repository.deleteById(id);
    }
}
