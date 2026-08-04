import { ParkingDatasourceImpl } from "../../../infrastructure/datasources/parking.datasource.impl";
import { ModuleDatasourceImpl } from "../../../infrastructure/datasources/module.datasource.impl";
import type { ParkingEntity } from "../../../domain/entities/parking.entity";
import type { ModuleEntity } from "../../../domain/entities/module.entity";
import { getLocalConfigStatus } from "../config/config.api";

const parkingDatasource = new ParkingDatasourceImpl();
const moduleDatasource = new ModuleDatasourceImpl();

export type HeartbeatWorkspaceSnapshot = {
  linkedProject: ParkingEntity | null;
  modules: ModuleEntity[];
};

const resolveLinkedProject = (
  configuredProjectId: string | null,
  projects: ParkingEntity[],
): ParkingEntity | null => {
  const fallbackProjectId = projects[0]?.id ?? null;
  const projectId = configuredProjectId || fallbackProjectId;
  return projects.find((item) => item.id === projectId) ?? null;
};

export const loadHeartbeatWorkspaceSnapshot =
  async (): Promise<HeartbeatWorkspaceSnapshot> => {
    const [configStatus, parkings] = await Promise.all([
      getLocalConfigStatus(),
      parkingDatasource.getAll(),
    ]);

    const linkedProject = resolveLinkedProject(configStatus.proyectoId, parkings);
    const loadedModules = await moduleDatasource.getAll(linkedProject?.id ?? undefined);

    return {
      linkedProject,
      modules: loadedModules.filter((module) => module.estado),
    };
  };
