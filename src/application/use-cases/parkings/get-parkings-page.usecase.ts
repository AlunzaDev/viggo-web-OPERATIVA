import type {
  PaginatedParkingResult,
  PaginationParams,
} from "../../../domain/datasources/parking.datasource";
import { ParkingRepository } from "../../../domain/repositories/parking.repository";

export class GetParkingsPage {
  private readonly repository: ParkingRepository;

  constructor(repository: ParkingRepository) {
    this.repository = repository;
  }

  execute(params: PaginationParams): Promise<PaginatedParkingResult> {
    return this.repository.getPage(params);
  }
}