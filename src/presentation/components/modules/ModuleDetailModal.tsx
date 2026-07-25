import {
  FaAlignLeft,
  FaHashtag,
  FaLayerGroup,
  FaLink,
  FaProjectDiagram,
  FaShieldAlt,
  FaUnlink,
  FaMicrochip,
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
  getRuntimeStatusClassName,
} from "../../utils/modules/moduleDetail.utils";

type ModuleDetailModalProps = {
  open: boolean;
  item: ModuleEntity | null;
  projectName: string;
  isSubmitting: boolean;
  error: string | null;
  onEdit: (item: ModuleEntity) => void;
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
  onResetBinding,
  onOpenRequest,
  onClose,
}: ModuleDetailModalProps) {
  const currentBinding = item?.deviceBinding ?? null;

  return (
    <UniqueModalBase
      open={open}
      title="Detalle del modulo"
      entityName={item?.nombre || "Modulo"}
      className="admin-crud-detail-modal"
      isSubmitting={isSubmitting}
      error={error}
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
      onEditStart={() => {
        if (item) onEdit(item);
      }}
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

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaMicrochip className="modal-section-icon" />
          <h3 className="modal-section-title">Submodulos</h3>
        </div>
        {item?.submodulos.length ? (
          <div className="admin-crud-request-list">
            {item.submodulos.map((submodulo) => (
              <article key={submodulo.submoduloId} className="admin-crud-request-card">
                <div className="admin-crud-request-card__header">
                  <span className="admin-crud-pill">{submodulo.tipo}</span>
                  <span className={submodulo.estado ? "admin-crud-status admin-crud-status--active" : "admin-crud-status admin-crud-status--inactive"}>
                    {submodulo.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="admin-crud-request-card__body">
                  <strong>{submodulo.nombre}</strong>
                  <span>ID: {submodulo.identificador || submodulo.submoduloId}</span>
                  <span>IP: {submodulo.ip || "Sin IP"}</span>
                  <span>MAC: {submodulo.mac || "Sin MAC"}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-crud-detail-item">
            <p className="admin-crud-detail-muted">Sin submodulos registrados</p>
          </div>
        )}
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaLink className="modal-section-icon" />
          <h3 className="modal-section-title">Huella autorizada</h3>
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

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaShieldAlt className="modal-section-icon" />
          <h3 className="modal-section-title">Estado vivo del dispositivo</h3>
        </div>
        {item?.deviceRuntime ? (
          <div className="modal-section-grid">
            <article className="form-group admin-crud-detail-item">
              <label>Estado vivo</label>
              <p>
                <span className={getRuntimeStatusClassName(item.deviceRuntime.connectionStatus)}>
                  {item.deviceRuntime.connectionStatus}
                </span>
              </p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Conectado ahora</label>
              <p>{item.deviceRuntime.isConnected ? "Si" : "No"}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Sesion autorizada</label>
              <p>{item.deviceRuntime.isAuthorized ? "Si" : "No"}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Socket activo</label>
              <p>{item.deviceRuntime.socketId || "Sin dato"}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Conectado desde</label>
              <p>{formatDateTime(item.deviceRuntime.connectedAt)}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Ultimo heartbeat</label>
              <p>{formatDateTime(item.deviceRuntime.lastHeartbeatAt)}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Ultima desconexion</label>
              <p>{formatDateTime(item.deviceRuntime.lastDisconnectAt)}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Huella viva</label>
              <p>{formatFingerprintPreview(item.deviceRuntime.fingerprint)}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>IP viva</label>
              <p>{item.deviceRuntime.ipAddress || "Sin dato"}</p>
            </article>
            <article className="form-group admin-crud-detail-item">
              <label>Ubicacion viva</label>
              <p>{item.deviceRuntime.locationLabel || "Sin dato"}</p>
            </article>
            <article className="form-group modal-field-full admin-crud-detail-item">
              <label>Mensaje</label>
              <p>
                {item.deviceRuntime.message || (
                  <span className="admin-crud-detail-muted">Sin mensaje</span>
                )}
              </p>
            </article>
          </div>
        ) : (
          <div className="admin-crud-detail-item">
            <p className="admin-crud-detail-muted">Sin estado vivo registrado</p>
          </div>
        )}
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaShieldAlt className="modal-section-icon" />
          <h3 className="modal-section-title">Solicitudes</h3>
        </div>
        {item?.deviceBindingRequests.length ? (
          <div className="admin-crud-request-list">
            {item.deviceBindingRequests.map((request, index) => (
              <button
                key={`${request.fingerprint}-${request.requestedAt.toISOString()}-${index}`}
                type="button"
                className="admin-crud-request-card"
                onClick={() => onOpenRequest(item, request)}
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
        ) : (
          <div className="admin-crud-detail-item">
            <p className="admin-crud-detail-muted">Sin solicitudes registradas</p>
          </div>
        )}
      </section>
    </UniqueModalBase>
  );
}
