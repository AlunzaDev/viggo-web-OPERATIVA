import type { ReactNode } from "react";
import "./SidebarFilterForm.css";

export function SidebarFilterForm({ children }: { children: ReactNode }) {
  return <section className="sidebar-filter-form">{children}</section>;
}

export function SidebarFilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="sidebar-filter-form__field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
