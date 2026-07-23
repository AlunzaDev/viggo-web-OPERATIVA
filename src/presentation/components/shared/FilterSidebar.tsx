import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import "./FilterSidebar.css";

type FilterSidebarProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onApply?: () => void;
  onReset?: () => void;
  children: ReactNode;
  width?: number;
};

export function FilterSidebar({
  open,
  title,
  onClose,
  onApply,
  onReset,
  children,
  width = 360,
}: FilterSidebarProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="filter-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          <motion.aside
            className="filter-sidebar"
            style={{ width: `${width}px`, maxWidth: "92vw" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="filter-sidebar__header">
              <h3>{title}</h3>

              <button
                type="button"
                className="filter-sidebar__icon-btn"
                onClick={onClose}
                aria-label="Cerrar filtros"
                title="Cerrar filtros"
              >
                <FaTimes />
              </button>
            </header>

            <div className="filter-sidebar__body">{children}</div>

            <footer className="filter-sidebar__footer">
              {onReset && (
                <button
                  type="button"
                  className="filter-sidebar__btn filter-sidebar__btn--ghost"
                  onClick={onReset}
                >
                  Limpiar filtros
                </button>
              )}

              <button
                type="button"
                className="filter-sidebar__btn filter-sidebar__btn--primary"
                onClick={onApply ?? onClose}
              >
                Aplicar
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
