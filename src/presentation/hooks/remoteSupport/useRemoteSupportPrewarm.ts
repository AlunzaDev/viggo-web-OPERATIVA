import { useEffect, useMemo, useRef, useState } from "react";
import { createProjectRemoteSupportSessionUrlUseCase } from "../../../application/dependencies/module.dependencies";
import type { ModuleEntity } from "../../../domain/entities/module.entity";
import { getRemoteSupportLinks } from "../../services/remoteSupport/remote-support.presenter";

const PREWARM_TTL_MS = 60_000;
const DESKTOP_VIEW_MODE = 11;
const TERMINAL_VIEW_MODE = 12;

type PrewarmStatus = "idle" | "warming" | "ready" | "failed";

type PrewarmCacheEntry = {
  loginUrl: string;
  expiresAt: number;
};

const projectPrewarmCache = new Map<string, PrewarmCacheEntry>();
const pendingProjectPrewarm = new Map<string, Promise<string>>();

export const toEmbeddedMeshCentralUrl = (value: string) => {
  if (!value) return "";

  try {
    const url = new URL(value);
    return `/meshcentral${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
};

const isRemoteSupportReady = (module: ModuleEntity | null) =>
  Boolean(module?.remoteSupport?.enabled && module.remoteSupport.deviceId);

const createProjectLoginUrl = async (projectId: string) => {
  const session = await createProjectRemoteSupportSessionUrlUseCase.execute(projectId);
  return toEmbeddedMeshCentralUrl(session.loginUrl || session.url);
};

export function useRemoteSupportPrewarm(
  projectId: string,
  module: ModuleEntity | null,
  projectRemoteSupportBaseUrl = "",
) {
  const [loginUrl, setLoginUrl] = useState("");
  const [status, setStatus] = useState<PrewarmStatus>("idle");
  const activeProjectRef = useRef("");

  const projectKey = useMemo(
    () => (projectId ? `project:${projectId}` : ""),
    [projectId],
  );

  const remoteSupportUrls = useMemo(() => {
    if (!isRemoteSupportReady(module)) {
      return { desktopUrl: "", terminalUrl: "" };
    }

    const links = getRemoteSupportLinks(module?.remoteSupport, {
      inheritedBaseUrl: projectRemoteSupportBaseUrl,
    });
    const desktopLink = links.find((link) => link.viewMode === DESKTOP_VIEW_MODE);
    const terminalLink = links.find((link) => link.viewMode === TERMINAL_VIEW_MODE);

    return {
      desktopUrl: toEmbeddedMeshCentralUrl(desktopLink?.url ?? ""),
      terminalUrl: toEmbeddedMeshCentralUrl(terminalLink?.url ?? ""),
    };
  }, [module, projectRemoteSupportBaseUrl]);

  const desktopUrl = remoteSupportUrls.desktopUrl;
  const terminalUrl = remoteSupportUrls.terminalUrl;
  const activeUrl = desktopUrl || loginUrl;

  useEffect(() => {
    let isCancelled = false;
    activeProjectRef.current = projectKey;

    if (!projectId || !projectKey) {
      setLoginUrl("");
      setStatus("idle");
      return;
    }

    const cached = projectPrewarmCache.get(projectKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      setLoginUrl(cached.loginUrl);
      setStatus("ready");
      return;
    }

    setStatus("warming");

    const promise =
      pendingProjectPrewarm.get(projectKey) ??
      createProjectLoginUrl(projectId).finally(() => {
        pendingProjectPrewarm.delete(projectKey);
      });

    pendingProjectPrewarm.set(projectKey, promise);

    promise
      .then((nextLoginUrl) => {
        if (isCancelled || activeProjectRef.current !== projectKey) return;

        projectPrewarmCache.set(projectKey, {
          loginUrl: nextLoginUrl,
          expiresAt: Date.now() + PREWARM_TTL_MS,
        });
        setLoginUrl(nextLoginUrl);
        setStatus("ready");
      })
      .catch(() => {
        if (isCancelled || activeProjectRef.current !== projectKey) return;
        setLoginUrl("");
        setStatus("failed");
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId, projectKey]);

  return {
    prewarmUrl: activeUrl,
    prewarmLoginUrl: loginUrl,
    prewarmDesktopUrl: desktopUrl,
    prewarmTerminalUrl: terminalUrl,
    prewarmStatus: status,
  };
}
