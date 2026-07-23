import type { ReactNode } from "react";
import Swal from "sweetalert2";
import { FaCheckCircle, FaEdit, FaSave } from "react-icons/fa";
import { BaseModalWrapper } from "./BaseModalWrapper";

export type UniqueModalBaseProps = {
  open: boolean;
  title: string;
  entityName: string;
  className?: string;
  isEntityActive?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  isEditing?: boolean;
  canSave?: boolean;
  onClose: () => void;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  onSaveChanges?: () => Promise<void> | void;
  onToggleStatus?: () => Promise<void> | void;
  toggleStatusText?: string;
  toggleStatusIcon?: ReactNode;
  extraActions?: ReactNode;
  showEditAction?: boolean;
  children: ReactNode;
};

export function UniqueModalBase({
  open,
  title,
  entityName,
  className = "",
  isEntityActive = false,
  isSubmitting = false,
  error = null,
  isEditing = false,
  canSave = true,
  onClose,
  onEditStart,
  onEditCancel,
  onSaveChanges,
  onToggleStatus,
  toggleStatusText,
  toggleStatusIcon,
  extraActions,
  showEditAction = Boolean(onEditStart),
  children,
}: UniqueModalBaseProps) {
  const modalClassName = ["unique-base-modal", className].filter(Boolean).join(" ");

  const handleGuardarCambios = () => {
    if (!onSaveChanges) return;

    Swal.fire({
      title: "Confirmar cambios",
      text: `Estas seguro de que deseas actualizar a "${entityName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, guardar",
      cancelButtonText: "Cancelar",
      background: "transparent",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
      },
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await onSaveChanges();

        const Toast = Swal.mixin({
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "transparent",
        });

        Toast.fire({ icon: "success", title: "Cambios guardados" });
      } catch {
        // El error visual se maneja desde el componente padre.
      }
    });
  };

  const handleToggleEstado = () => {
    if (!onToggleStatus) return;

    const action = isEntityActive ? "desactivar" : "activar";
    const actionCap = action.charAt(0).toUpperCase() + action.slice(1);

    Swal.fire({
      title: `${actionCap}?`,
      text: `Estas seguro de que deseas ${action} a "${entityName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: "Cancelar",
      background: "transparent",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
      },
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await onToggleStatus();
      } catch {
        // El error visual se maneja desde el componente padre.
      }
    });
  };

  return (
    <BaseModalWrapper
      open={open}
      onClose={onClose}
      isSubmitting={isSubmitting}
      showCloseButton={true}
      className={modalClassName}
    >
      <h2 className="modal-form-title">{title}</h2>

      <div className="modal-form-sections">{children}</div>

      {error && (
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--error-color)",
            fontSize: "0.86rem",
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}

      <div className="modal-form-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              className="btn-form-secondary btn-form-secondary--cancel"
              onClick={onEditCancel}
              disabled={isSubmitting || !onEditCancel}
            >
              Cancelar edicion
            </button>
            <button
              type="button"
              className="btn-form-primary"
              onClick={handleGuardarCambios}
              disabled={isSubmitting || !canSave || !onSaveChanges}
            >
              <FaSave />
              <span>{isSubmitting ? "Guardando..." : "Guardar cambios"}</span>
            </button>
          </>
        ) : (
          <>
            {extraActions}

            {showEditAction && onEditStart ? (
              <button
                type="button"
                className="btn-form-secondary btn-form-secondary--edit"
                onClick={onEditStart}
                disabled={isSubmitting}
              >
                <FaEdit />
                <span>Editar</span>
              </button>
            ) : null}

            {onToggleStatus && toggleStatusText ? (
              <button
                type="button"
                className="btn-form-primary"
                onClick={handleToggleEstado}
                disabled={isSubmitting}
              >
                {toggleStatusIcon || <FaCheckCircle />}
                <span>{isSubmitting ? "Actualizando..." : toggleStatusText}</span>
              </button>
            ) : null}
          </>
        )}
      </div>
    </BaseModalWrapper>
  );
}
