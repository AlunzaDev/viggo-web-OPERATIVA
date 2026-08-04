import { FaEdit, FaInfoCircle, FaPowerOff } from "react-icons/fa";

type CrudRowActionsProps = {
  entityName: string;
  isActive?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void | Promise<void>;
  viewTitle?: string;
  editTitle?: string;
  deactivateTitle?: string;
  activateTitle?: string;
};

export function CrudRowActions({
  entityName,
  isActive = true,
  onView,
  onEdit,
  onToggleStatus,
  viewTitle = "Detalle",
  editTitle = "Editar",
  deactivateTitle = "Desactivar",
  activateTitle = "Activar",
}: CrudRowActionsProps) {
  return (
    <div className="admin-crud-row-actions">
      {onView ? (
        <button
          className="admin-crud-icon-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
          aria-label={`Ver detalle de ${entityName}`}
          title={viewTitle}
        >
          <FaInfoCircle />
        </button>
      ) : null}
      {onEdit ? (
        <button
          className="admin-crud-icon-button admin-crud-icon-button--edit"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label={`Editar ${entityName}`}
          title={editTitle}
        >
          <FaEdit />
        </button>
      ) : null}
      {onToggleStatus ? (
        <button
          className="admin-crud-icon-button admin-crud-icon-button--warning"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void onToggleStatus();
          }}
          aria-label={`${isActive ? deactivateTitle : activateTitle} ${entityName}`}
          title={isActive ? deactivateTitle : activateTitle}
        >
          <FaPowerOff />
        </button>
      ) : null}
    </div>
  );
}
