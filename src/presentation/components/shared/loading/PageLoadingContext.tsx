import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PageLoadingContext } from "./page-loading-context.value";

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [loadingEntries, setLoadingEntries] = useState<Record<string, string>>({});

  const register = useCallback((id: string, label: string) => {
    setLoadingEntries((prev) => {
      if (prev[id] === label) return prev;
      return { ...prev, [id]: label };
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setLoadingEntries((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const value = useMemo(
    () => {
      const labels = Object.values(loadingEntries);

      return {
        isPageLoading: labels.length > 0,
        label: labels[0] || "vista",
        register,
        unregister,
      };
    },
    [loadingEntries, register, unregister]
  );

  return <PageLoadingContext.Provider value={value}>{children}</PageLoadingContext.Provider>;
}
