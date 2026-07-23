import { createContext } from "react";

export type PageLoadingContextValue = {
  isPageLoading: boolean;
  label: string;
  register: (id: string, label: string) => void;
  unregister: (id: string) => void;
};

export const PageLoadingContext = createContext<PageLoadingContextValue | null>(null);
