import {
  FaBroadcastTower,
  FaCalendarAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaMicrochip,
  FaQrcode,
  FaReceipt,
  FaSatelliteDish,
  FaWallet,
} from "react-icons/fa";
import { CopyableId } from "../CopyableId";
import { UniqueModalBase } from "../modals/UniqueModalBase";
import "../../../styles/shared/OperationalLogDetailModal.css";

export type OperationalLogDetailItem = {
  id: string;
  kind: "event" | "incident";
  scope: "access_flow" | "device" | "payment" | "system";
  type: string;
  severity: "info" | "warning" | "critical";
  projectName?: string;
  moduloNombre?: string;
  ticketId?: string;
  paymentSessionId?: string;
  source: "backend" | "device" | "app" | "sync" | "system";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
};

type OperationalLogDetailModalProps = {
  open: boolean;
  log: OperationalLogDetailItem | null;
  onClose: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "full",
  timeStyle: "short",
});

const getKindLabel = (kind: OperationalLogDetailItem["kind"]) =>
  kind === "incident" ? "Incidencia" : "Evento";

const getScopeLabel = (scope: OperationalLogDetailItem["scope"]) =>
  ({
    payment: "Pago",
    device: "Dispositivo",
    access_flow: "Acceso",
    system: "Sistema",
  })[scope] ?? scope;

const getSeverityLabel = (severity: OperationalLogDetailItem["severity"]) =>
  ({
    info: "Info",
    warning: "Advertencia",
    critical: "Critica",
  })[severity] ?? severity;

const getSourceLabel = (source: OperationalLogDetailItem["source"]) =>
  ({
    backend: "Backend",
    device: "Device",
    app: "App",
    sync: "Sync",
    system: "Sistema",
  })[source] ?? source;

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const getTypeIcon = (type: string) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("qr")) return <FaQrcode />;
  if (normalizedType.includes("cash") || normalizedType.includes("payment")) return <FaWallet />;
  if (normalizedType.includes("heartbeat") || normalizedType.includes("device")) {
    return <FaBroadcastTower />;
  }
  return <FaClipboardList />;
};

export function OperationalLogDetailModal({
  open,
  log,
  onClose,
}: OperationalLogDetailModalProps) {
  if (!log) return null;

  const metadataEntries = Object.entries(log.metadata ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );

  return (
    <UniqueModalBase
      open={open}
      title="Detalle del movimiento"
      entityName={log.type}
      className="operational-log-detail-modal"
      onClose={onClose}
      showEditAction={false}
    >
      <section className="modal-form-section">
        <div className="operational-log-detail-modal__hero shared-modal-hero">
          <div className="operational-log-detail-modal__hero-icon">
            {getTypeIcon(log.type)}
          </div>
          <div className="operational-log-detail-modal__hero-copy shared-modal-hero__copy">
            <div className="operational-log-detail-modal__hero-badges">
              <span className={`operational-log-detail-modal__pill is-${log.kind}`}>
                {log.kind === "incident" ? <FaExclamationTriangle /> : <FaClipboardList />}
                {getKindLabel(log.kind)}
              </span>
              <span className="operational-log-detail-modal__pill">{getScopeLabel(log.scope)}</span>
              <span className="operational-log-detail-modal__pill">{getSeverityLabel(log.severity)}</span>
            </div>
            <h4 className="shared-modal-hero__title">{log.message}</h4>
            <p className="shared-modal-hero__meta">{log.type}</p>
            <div className="operational-log-detail-modal__hero-copyable">
              <CopyableId value={log.id} copyLabel="Copiar ID del movimiento" />
            </div>
          </div>
        </div>
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaClipboardList />
          <h3 className="modal-section-title">Informacion general</h3>
        </div>
        <div className="modal-section-grid">
          <article className="form-group operational-log-detail-modal__item">
            <label><FaCalendarAlt /> Fecha</label>
            <p>{dateFormatter.format(new Date(log.createdAt))}</p>
          </article>
          <article className="form-group operational-log-detail-modal__item">
            <label><FaSatelliteDish /> Origen</label>
            <p>{getSourceLabel(log.source)}</p>
          </article>
          <article className="form-group operational-log-detail-modal__item">
            <label><FaLayerGroup /> Flujo</label>
            <p>{getScopeLabel(log.scope)}</p>
          </article>
          <article className="form-group operational-log-detail-modal__item">
            <label><FaReceipt /> Sesion</label>
            <p>{log.paymentSessionId || "Sin sesion"}</p>
          </article>
          <article className="form-group operational-log-detail-modal__item">
            <label><FaMapMarkerAlt /> Proyecto</label>
            <p>{log.projectName || "Sin proyecto"}</p>
          </article>
          <article className="form-group operational-log-detail-modal__item">
            <label><FaMicrochip /> Modulo</label>
            <p>{log.moduloNombre || "Sin modulo"}</p>
          </article>
          <article className="form-group operational-log-detail-modal__item">
            <label><FaQrcode /> Ticket</label>
            <p>{log.ticketId || "Sin ticket"}</p>
          </article>
        </div>
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaClipboardList />
          <h3 className="modal-section-title">Metadata completa</h3>
        </div>
        {metadataEntries.length ? (
          <div className="operational-log-detail-modal__metadata">
            {metadataEntries.map(([key, value]) => (
              <article key={key} className="form-group operational-log-detail-modal__item">
                <label>{key}</label>
                {typeof value === "object" ? (
                  <pre className="operational-log-detail-modal__json">{formatValue(value)}</pre>
                ) : (
                  <p>{formatValue(value)}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="operational-log-detail-modal__empty">Este movimiento no trae metadata adicional.</p>
        )}
      </section>
    </UniqueModalBase>
  );
}
