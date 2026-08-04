import { beforeEach, describe, expect, it, vi } from "vitest";

const getLocalConfigStatusMock = vi.fn();
const parkingGetAllMock = vi.fn();
const moduleGetAllMock = vi.fn();

vi.mock("../config/config.api", () => ({
  getLocalConfigStatus: getLocalConfigStatusMock,
}));

vi.mock("../../../infrastructure/datasources/parking.datasource.impl", () => ({
  ParkingDatasourceImpl: class {
    getAll = parkingGetAllMock;
  },
}));

vi.mock("../../../infrastructure/datasources/module.datasource.impl", () => ({
  ModuleDatasourceImpl: class {
    getAll = moduleGetAllMock;
  },
}));

describe("heartbeat.service", () => {
  beforeEach(() => {
    getLocalConfigStatusMock.mockReset();
    parkingGetAllMock.mockReset();
    moduleGetAllMock.mockReset();
  });

  it("loads linked project and only active modules", async () => {
    getLocalConfigStatusMock.mockResolvedValue({ proyectoId: "project-2" });
    parkingGetAllMock.mockResolvedValue([
      { id: "project-1", nombre: "A" },
      { id: "project-2", nombre: "B" },
    ]);
    moduleGetAllMock.mockResolvedValue([
      { id: "module-1", estado: true },
      { id: "module-2", estado: false },
    ]);

    const { loadHeartbeatWorkspaceSnapshot } = await import("./heartbeat.service");
    const result = await loadHeartbeatWorkspaceSnapshot();

    expect(moduleGetAllMock).toHaveBeenCalledWith("project-2");
    expect(result.linkedProject?.id).toBe("project-2");
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0]?.id).toBe("module-1");
  });

  it("falls back to the first project when config has no linked project", async () => {
    getLocalConfigStatusMock.mockResolvedValue({ proyectoId: null });
    parkingGetAllMock.mockResolvedValue([{ id: "project-1", nombre: "A" }]);
    moduleGetAllMock.mockResolvedValue([]);

    const { loadHeartbeatWorkspaceSnapshot } = await import("./heartbeat.service");
    const result = await loadHeartbeatWorkspaceSnapshot();

    expect(moduleGetAllMock).toHaveBeenCalledWith("project-1");
    expect(result.linkedProject?.id).toBe("project-1");
  });
});
