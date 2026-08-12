import { ParkingEntity } from "../../../domain/entities/parking.entity";
import { ParkingRepository } from "../../../domain/repositories/parking.repository";
import { UpdateParkingDto } from "../../../application/dtos/parking/update-parking.dto";

export interface UpdateParkingUseCase {
    execute(dto: UpdateParkingDto): Promise<ParkingEntity>;
}

export class UpdateParking implements UpdateParkingUseCase {
    private readonly repository: ParkingRepository;

    constructor(repository: ParkingRepository) {
        this.repository = repository;
    }

    execute(dto: UpdateParkingDto): Promise<ParkingEntity> {
        return this.repository.updateById(dto);
    }
}
