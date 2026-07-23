import { createContext } from "react";

export type PageTitleContextValue = {
  pageTitle: string;
  setPageTitle: (title: string) => void;
};

export const PageTitleContext = createContext<PageTitleContextValue | null>(null);
