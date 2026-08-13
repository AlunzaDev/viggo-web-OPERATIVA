import { ApproveModuleDeviceBinding } from "../use-cases/modules/approve-module-device-binding.usecase";
import { CreateModuleRemoteSupportSessionUrl } from "../use-cases/modules/create-module-remote-support-session-url.usecase";
import { CreateProjectRemoteSupportSessionUrl } from "../use-cases/modules/create-project-remote-support-session-url.usecase";
import { CreateModule } from "../use-cases/modules/create-module.usecase";
import { DeleteModule } from "../use-cases/modules/delete-module.usecase";
import { GetModulesPage } from "../use-cases/modules/get-modules-page.usecase";
import { RejectModuleDeviceBinding } from "../use-cases/modules/reject-module-device-binding.usecase";
import { ReopenModuleDeviceBinding } from "../use-cases/modules/reopen-module-device-binding.usecase";
import { ResetModuleDeviceBinding } from "../use-cases/modules/reset-module-device-binding.usecase";
import { ResolveModuleRemoteSupportDevice } from "../use-cases/modules/resolve-module-remote-support-device.usecase";
import { UpdateModule } from "../use-cases/modules/update-module.usecase";
import { ModuleDatasourceImpl } from "../../infrastructure/datasources/module.datasource.impl";
import { ModuleRepositoryImpl } from "../../infrastructure/repositories/module.repository.impl";

const moduleDatasource = new ModuleDatasourceImpl();
const moduleRepository = new ModuleRepositoryImpl(moduleDatasource);

export const createModuleUseCase = new CreateModule(moduleRepository);
export const updateModuleUseCase = new UpdateModule(moduleRepository);
export const deleteModuleUseCase = new DeleteModule(moduleRepository);
export const getModulesPageUseCase = new GetModulesPage(moduleRepository);
export const approveModuleDeviceBindingUseCase = new ApproveModuleDeviceBinding(moduleRepository);
export const rejectModuleDeviceBindingUseCase = new RejectModuleDeviceBinding(moduleRepository);
export const reopenModuleDeviceBindingUseCase = new ReopenModuleDeviceBinding(moduleRepository);
export const resetModuleDeviceBindingUseCase = new ResetModuleDeviceBinding(moduleRepository);
export const resolveModuleRemoteSupportDeviceUseCase = new ResolveModuleRemoteSupportDevice(moduleRepository);
export const createModuleRemoteSupportSessionUrlUseCase = new CreateModuleRemoteSupportSessionUrl(moduleRepository);
export const createProjectRemoteSupportSessionUrlUseCase = new CreateProjectRemoteSupportSessionUrl(moduleRepository);
