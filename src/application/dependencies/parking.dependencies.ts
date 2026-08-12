import { ParkingDatasourceImpl } from "../../infrastructure/datasources/parking.datasource.impl";
import { ParkingRepositoryImpl } from "../../infrastructure/repositories/parking.repository.impl";
import { CreateParking } from "../use-cases/parkings/create-parking.usecase";
import { DeleteParking } from "../use-cases/parkings/delete-parking.usecase";
import { GetParkingsPage } from "../use-cases/parkings/get-parkings-page.usecase";
import { UpdateParking } from "../use-cases/parkings/update-parking.usecase";

const parkingDatasource = new ParkingDatasourceImpl();
const parkingRepository = new ParkingRepositoryImpl(parkingDatasource);

export const createParkingUseCase = new CreateParking(parkingRepository);
export const updateParkingUseCase = new UpdateParking(parkingRepository);
export const deleteParkingUseCase = new DeleteParking(parkingRepository);
export const getParkingsPageUseCase = new GetParkingsPage(parkingRepository);