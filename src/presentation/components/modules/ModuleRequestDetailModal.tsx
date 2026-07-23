import { FaCheckCircle, FaClock, FaShieldAlt, FaUnlink } from "react-icons/fa";
import {
  ModuleEntity,
  type ModuleDeviceBindingRequest,
} from "../../../domain/entities/module.entity";
import { UniqueModalBase } from "../shared/modals/UniqueModalBase";
import {
  buildBindingSummary,
  formatDateTime,
  getRequestStatusClassName,
} from "../../utils/modules/moduleDetail.utils";

type ModuleRequestDetailModalProps = {
  open: boolean;
  item: ModuleEntity | null;
  request: ModuleDeviceBindingRequest | null;
  isSubmitting: boolean;
  error: string | null;
  onApproveBinding: (item: ModuleEntity, request: ModuleDeviceBindingRequest) => Promise<void>;
  onRejectBinding: (item: ModuleEntity, request: ModuleDeviceBindingRequest) => Promise<void>;
  onReopenBinding: (item: ModuleEntity, request: ModuleDeviceBindingRequest) => Promise<void>;
  onClose: () => void;
};

export function ModuleRequestDetailModal({
  open,
  item,
  request,
  isSubmitting,
  error,
  onApproveBinding,
  onRejectBinding,
  onReopenBinding,
  onClose,
}: ModuleRequestDetailModalProps) {
  const canResolve = Boolean(item && request && request.status === "PENDING");
  const canReopen = Boolean(item && request && request.status !== "PENDING");
  const reopenLabel =
    request?.status === "APPROVED"
      ? "Quitar aprobacion y pasar a pendiente"
      : "Reabrir solicitud";

  return (
    <UniqueModalBase
      open={open}
      title="Detalle de solicitud"
      entityName={item?.nombre || "Solicitud"}
      className="admin-crud-detail-modal"
      isSubmitting={isSubmitting}
      error={error}
      onClose={onClose}
      showEditAction={false}
      extraActions={
        (canResolve || canReopen) && item && request ? (
          <>
            {canReopen ? (
              <button
                type="button"
                className="btn-form-secondary"
                disabled={isSubmitting}
                onClick={() => {
                  void onReopenBinding(item, request);
                }}
              >
                <FaClock />
                <span>{reopenLabel}</span>
              </button>
            ) : null}
            {canResolve ? (
              <>
                <button
                  type="button"
                  className="btn-form-secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    void onRejectBinding(item, request);
                  }}
                >
                  <FaUnlink />
                  <span>Rechazar huella</span>
                </button>
                <button
                  type="button"
                  className="btn-form-primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    void onApproveBinding(item, request);
                  }}
                >
                  <FaCheckCircle />
                  <span>Aprobar huella</span>
                </button>
              </>
            ) : null}
          </>
        ) : null
      }
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaShieldAlt className="modal-section-icon" />
          <h3 className="modal-section-title">Solicitud</h3>
        </div>
        <div className="modal-section-grid">
          {buildBindingSummary(request).map((field) => (
            <article
              key={`request-${field.label}`}
              className="form-group admin-crud-detail-item"
            >
              <label>{field.label}</label>
              <p>{field.value}</p>
            </article>
          ))}
          <article className="form-group admin-crud-detail-item">
            <label>Estatus</label>
            <p>
              <span className={getRequestStatusClassName(request?.status)}>
                {request?.status || "Sin dato"}
              </span>
            </p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Solicitado</label>
            <p>{formatDateTime(request?.requestedAt)}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Resuelto</label>
            <p>{formatDateTime(request?.resolvedAt)}</p>
          </article>
          <article className="form-group modal-field-full admin-crud-detail-item">
            <label>Notas</label>
            <p>
              {request?.notes || (
                <span className="admin-crud-detail-muted">Sin notas</span>
              )}
            </p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>IP</label>
            <p>{request?.ipAddress || "Sin dato"}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Ubicacion</label>
            <p>{request?.locationLabel || "Sin dato"}</p>
          </article>
        </div>
      </section>
    </UniqueModalBase>
  );
}
