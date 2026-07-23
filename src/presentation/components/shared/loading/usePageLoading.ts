import { useContext, useId, useLayoutEffect } from "react";
import { PageLoadingContext } from "./page-loading-context.value";

export function usePageLoadingState() {
  const context = useContext(PageLoadingContext);
  return {
    isAvailable: Boolean(context),
    isPageLoading: context?.isPageLoading ?? false,
    label: context?.label ?? "vista",
  };
}

export function usePageLoadingSignal(isLoading: boolean, label: string) {
  const context = useContext(PageLoadingContext);
  const register = context?.register;
  const unregister = context?.unregister;
  const id = useId();

  useLayoutEffect(() => {
    if (!register || !unregister) return;

    if (isLoading) {
      register(id, label);
      return () => unregister(id);
    }

    unregister(id);
    return undefined;
  }, [id, isLoading, label, register, unregister]);

  return Boolean(context);
}
