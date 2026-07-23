import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

// Asegúrate de enlazar la ruta hasta modal-form-base.css (ajusta el path relativo si es necesario)
import "../../../styles/modal-form-base.css";

export type BaseModalWrapperProps = {
  open: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
  className?: string;
  showCloseButton?: boolean;
  children: ReactNode;
};

export function BaseModalWrapper({
  open,
  onClose,
  isSubmitting = false,
  className = "",
  showCloseButton = true,
  children,
}: BaseModalWrapperProps) {
  const backdropPressStartedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isSubmitting) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, isSubmitting]);

  if (typeof window === "undefined") return null;

  const handleBackdropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    backdropPressStartedRef.current = event.target === event.currentTarget;
  };

  const handleBackdropPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const shouldClose =
      backdropPressStartedRef.current &&
      event.target === event.currentTarget &&
      !isSubmitting;

    backdropPressStartedRef.current = false;
    if (shouldClose) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-form-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onPointerDown={handleBackdropPointerDown}
          onPointerUp={handleBackdropPointerUp}
        >
          <motion.section
            className={`modal-form-card ${className}`}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            {showCloseButton && (
              <button
                type="button"
                className="modal-form-close-btn"
                onClick={onClose}
                aria-label="Cerrar modal"
                disabled={isSubmitting}
              >
                <FaTimes />
              </button>
            )}
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
