import {
  FaAlignLeft,
  FaHashtag,
  FaLayerGroup,
  FaLink,
  FaPowerOff,
  FaProjectDiagram,
  FaShieldAlt,
  FaUnlink,
} from "react-icons/fa";
import {
  ModuleEntity,
  type ModuleDeviceBindingRequest,
} from "../../../domain/entities/module.entity";
import { CopyableId } from "../shared/CopyableId";
import { UniqueModalBase } from "../shared/modals/UniqueModalBase";
import {
  buildBindingSummary,
  formatDateTime,
  formatFingerprintPreview,
  getBindingStatusClassName,
  getBindingStatusLabel,
  getRequestStatusClassName,
} from "../../utils/modules/moduleDetail.utils";

type ModuleDetailModalProps = {
  open: boolean;
  item: ModuleEntity | null;
  projectName: string;
  isSubmitting: boolean;
  error: string | null;
  onEdit?: (item: ModuleEntity) => void;
  onToggleStatus?: (item: ModuleEntity) => Promise<void>;
  onResetBinding: (item: ModuleEntity) => Promise<void>;
  onOpenRequest: (item: ModuleEntity, request: ModuleDeviceBindingRequest) => void;
  onClose: () => void;
};

export function ModuleDetailModal({
  open,
  item,
  projectName,
  isSubmitting,
  error,
  onEdit,
  onToggleStatus,
  onResetBinding,
  onOpenRequest,
  onClose,
}: ModuleDetailModalProps) {
  const currentBinding = item?.deviceBinding ?? null;
  const bindingRequests = item?.deviceBindingRequests ?? [];
  const hasBindingData = Boolean(
    currentBinding?.fingerprint ||
      currentBinding?.primaryMac ||
      currentBinding?.cpuSerial ||
      currentBinding?.machineId ||
      currentBinding?.boundAt ||
      currentBinding?.lastSeenAt,
  );
  const hasPendingRequests = bindingRequests.length > 0;

  return (
    <UniqueModalBase
      open={open}
      title="Detalle del modulo"
      entityName={item?.nombre || "Modulo"}
      className="admin-crud-detail-modal"
      isSubmitting={isSubmitting}
      error={error}
      isEntityActive={item?.estado ?? false}
      onClose={onClose}
      extraActions={
        item ? (
          <>
            {currentBinding ? (
              <button
                type="button"
                className="btn-form-secondary btn-form-secondary--cancel"
                disabled={isSubmitting}
                onClick={() => {
                  void onResetBinding(item);
                }}
              >
                <FaUnlink />
                <span>Desvincular</span>
              </button>
            ) : null}
          </>
        ) : null
      }
      onEditStart={
        onEdit
          ? () => {
              if (item) onEdit(item);
            }
          : undefined
      }
      onToggleStatus={
        onToggleStatus
          ? () => {
              if (!item) return Promise.resolve();
              return onToggleStatus(item);
            }
          : undefined
      }
      toggleStatusText={item?.estado ? "Desactivar" : "Activar"}
      toggleStatusIcon={<FaPowerOff />}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaLayerGroup className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion general</h3>
        </div>
        <div className="admin-crud-detail-hero">
          <div className="admin-crud-detail-hero__icon">
            <FaLayerGroup />
          </div>
          <div>
            <h4>{item?.nombre}</h4>
            {item ? (
              <CopyableId
                value={item.id}
                copyLabel={`Copiar ID de ${item.nombre}`}
              />
            ) : null}
          </div>
        </div>
        <div className="modal-section-grid">
          <article className="form-group admin-crud-detail-item">
            <label>
              <FaProjectDiagram /> Proyecto
            </label>
            <p>{projectName}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Tipo</label>
            <p>
              <span className="admin-crud-pill">{item?.tipo}</span>
            </p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>
              <FaHashtag /> Identificador
            </label>
            <p>{item?.identificador}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Estado</label>
            <p>{item?.estado ? "Activo" : "Inactivo"}</p>
          </article>
          <article className="form-group modal-field-full admin-crud-detail-item">
            <label>
              <FaAlignLeft /> Descripcion
            </label>
            <p>
              {item?.descripcion || (
                <span className="admin-crud-detail-muted">Sin descripcion</span>
              )}
            </p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>
              <FaShieldAlt /> Vinculacion
            </label>
            <p>
              <span className={item ? getBindingStatusClassName(item) : "admin-crud-status"}>
                {item ? getBindingStatusLabel(item) : "Sin dato"}
              </span>
            </p>
          </article>
        </div>
      </section>

      {hasBindingData ? (
        <section className="modal-form-section">
          <div className="modal-section-header">
            <FaLink className="modal-section-icon" />
            <h3 className="modal-section-title">Equipo vinculado</h3>
          </div>
          <div className="modal-section-grid">
            {buildBindingSummary(currentBinding, {
              maskFingerprint: true,
            }).map((field) => (
              <article
                key={field.label}
                className="form-group admin-crud-detail-item"
              >
                <label>{field.label}</label>
                <p>{field.value}</p>
              </article>
            ))}
            <article className="form-group admin-crud-detail-item">
              <label>Vinculado desde</label>
              <p>{formatDateTime(currentBinding?.boundAt)}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Ultima conexion</label>
              <p>{formatDateTime(currentBinding?.lastSeenAt)}</p>
            </article>
          </div>
        </section>
      ) : (
        <section className="modal-form-section">
          <div className="modal-section-header">
            <FaLink className="modal-section-icon" />
            <h3 className="modal-section-title">Equipo vinculado</h3>
          </div>
          <div className="admin-crud-detail-item">
            <p className="admin-crud-detail-muted">
              Aun no hay un equipo vinculado a este modulo.
            </p>
          </div>
        </section>
      )}

      {hasPendingRequests ? (
        <section className="modal-form-section">
          <div className="modal-section-header">
            <FaShieldAlt className="modal-section-icon" />
            <h3 className="modal-section-title">Solicitudes de vinculacion</h3>
          </div>
          <div className="admin-crud-request-list">
            {bindingRequests.map((request, index) => (
              <button
                key={`${request.fingerprint}-${request.requestedAt.toISOString()}-${index}`}
                type="button"
                className="admin-crud-request-card"
                onClick={() => {
                  if (!item) return;
                  onOpenRequest(item, request);
                }}
              >
                <div className="admin-crud-request-card__header">
                  <span className={getRequestStatusClassName(request.status)}>
                    {request.status}
                  </span>
                  <span className="admin-crud-request-card__date">
                    {formatDateTime(request.requestedAt)}
                  </span>
                </div>
                <div className="admin-crud-request-card__body">
                  <strong>Huella {formatFingerprintPreview(request.fingerprint)}</strong>
                  <span>MAC: {request.primaryMac || "Sin dato"}</span>
                  <span>CPU: {request.cpuSerial || "Sin dato"}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </UniqueModalBase>
  );
}
