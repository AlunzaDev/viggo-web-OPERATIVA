import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PageTitleContext } from "./page-title-context.value";

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState("");
  const value = useMemo(() => ({ pageTitle, setPageTitle }), [pageTitle]);

  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}
