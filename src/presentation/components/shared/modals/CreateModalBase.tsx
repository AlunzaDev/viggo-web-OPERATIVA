import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import Swal from "sweetalert2";
import { BaseModalWrapper } from "./BaseModalWrapper";

export type CreateModalBaseProps = {
  open: boolean;
  title: string;
  isSubmitting?: boolean;
  error?: string | null;
  className?: string;
  submitText?: string;
  submitIcon?: ReactNode;
  cancelText?: string;
  successToastMessage?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean | void> | boolean | void;
  children: ReactNode;
};

const showCreateModalToast = (icon: "error" | "success", title: string, text?: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: icon === "success" ? "bottom-end" : "top-end",
    showConfirmButton: false,
    timer: icon === "success" ? 3000 : 3600,
    timerProgressBar: true,
    background: "transparent",
    customClass: {
      popup: "swal2-toast",
      title: "swal-custom-title",
    },
    didOpen: (toast: HTMLElement) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  void Toast.fire({ icon, title, text });
};

const getSubmitErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "No se pudo guardar el registro.";

export function CreateModalBase({
  open,
  title,
  isSubmitting = false,
  error = null,
  className = "",
  submitText = "Guardar",
  submitIcon,
  cancelText = "Cancelar",
  successToastMessage = "Registro creado exitosamente",
  onClose,
  onSubmit,
  children,
}: CreateModalBaseProps) {
  const lastErrorToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      lastErrorToastRef.current = null;
      return;
    }

    const message = typeof error === "string" ? error.trim() : "";
    if (!message || lastErrorToastRef.current === message) return;

    lastErrorToastRef.current = message;
    showCreateModalToast("error", "No se pudo guardar", message);
  }, [error, open]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await onSubmit(e);
      if (result === false) return;

      showCreateModalToast("success", successToastMessage);
    } catch (submitError) {
      const message = getSubmitErrorMessage(submitError);
      lastErrorToastRef.current = message;
      showCreateModalToast("error", "No se pudo guardar", message);
    }
  };

  return (
    <BaseModalWrapper
      open={open}
      onClose={onClose}
      isSubmitting={isSubmitting}
      showCloseButton={true}
      className={["create-base-modal", className].filter(Boolean).join(" ")}
    >
      <h2 className="modal-form-title">{title}</h2>

      <form onSubmit={handleFormSubmit}>
        <div className="modal-form-sections">
          {children}
        </div>

        <div className="modal-form-actions">
          <button
            type="button"
            className="btn-form-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelText}
          </button>

          <button
            type="submit"
            className="btn-form-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="btn-form-spinner" aria-hidden="true" /> : submitIcon}
            <span>{isSubmitting ? "Guardando..." : submitText}</span>
          </button>
        </div>
      </form>
    </BaseModalWrapper>
  );
}
