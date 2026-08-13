export const MESH_CENTRAL_SUPPORT_VIEW_MODE = 10;
export const MESH_CENTRAL_DESKTOP_VIEW_MODE = 11;
export const MESH_CENTRAL_TERMINAL_VIEW_MODE = 12;

export type RemoteSupportViewMode =
  | typeof MESH_CENTRAL_SUPPORT_VIEW_MODE
  | typeof MESH_CENTRAL_DESKTOP_VIEW_MODE
  | typeof MESH_CENTRAL_TERMINAL_VIEW_MODE;

export const isEmbeddedRemoteSupportViewMode = (viewMode: number) =>
  viewMode === MESH_CENTRAL_DESKTOP_VIEW_MODE ||
  viewMode === MESH_CENTRAL_TERMINAL_VIEW_MODE;

export const getRemoteSupportViewLabel = (viewMode: number) =>
  viewMode === MESH_CENTRAL_TERMINAL_VIEW_MODE
    ? "terminal remota"
    : "pantalla remota";
