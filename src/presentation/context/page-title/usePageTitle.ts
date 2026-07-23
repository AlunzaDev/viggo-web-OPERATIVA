import { useContext, useEffect } from "react";
import { PageTitleContext } from "./page-title-context.value";

export function usePageTitle(title: string) {
  const context = useContext(PageTitleContext);
  const setPageTitle = context?.setPageTitle;

  useEffect(() => {
    if (!setPageTitle) return;

    setPageTitle(title);
    return () => setPageTitle("");
  }, [setPageTitle, title]);
}

export function useCurrentPageTitle() {
  const context = useContext(PageTitleContext);
  return context?.pageTitle ?? "";
}
