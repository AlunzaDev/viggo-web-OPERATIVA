const PREWARM_TTL_MS = 60_000;

type RemoteSupportPrewarmEntry = {
  authenticatedAt: number;
  expiresAt: number;
};

const authenticatedMeshCentralSessions = new Map<string, RemoteSupportPrewarmEntry>();

export const getRemoteSupportPrewarmKey = (moduleId: string) => `module:${moduleId}`;

export const markMeshCentralAuthenticated = (key: string) => {
  authenticatedMeshCentralSessions.set(key, {
    authenticatedAt: Date.now(),
    expiresAt: Date.now() + PREWARM_TTL_MS,
  });
};

export const hasWarmMeshCentralSession = (key: string) => {
  const session = authenticatedMeshCentralSessions.get(key);

  if (!session) return false;

  if (session.expiresAt <= Date.now()) {
    authenticatedMeshCentralSessions.delete(key);
    return false;
  }

  return true;
};
