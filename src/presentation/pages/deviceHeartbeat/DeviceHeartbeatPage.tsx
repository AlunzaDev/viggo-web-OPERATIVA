import { useMemo, useState } from "react";
import {
  FaBroadcastTower,
  FaCashRegister,
  FaDoorOpen,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaPlug,
  FaQrcode,
  FaSignOutAlt,
  FaSyncAlt,
  FaWifi,
} from "react-icons/fa";
import { useModules } from "../../hooks/modules/useModules";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { ScreenLoader } from "../../components/shared/loading/ScreenLoader";
import {
  buildHeartbeatStats,
  formatDateTime,
  getBindingLabel,
  getHeartbeatAgeLabel,
  getModuleTypeLabel,
  getStatusHint,
  getStatusLabel,
  resolveDeviceStatus,
  type DeviceHeartbeatFilter,
} from "./DeviceHeartbeatPage.helpers";
import "./DeviceHeartbeatPage.css";

const FILTERS: Array<{ id: DeviceHeartbeatFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline" },
  { id: "pending", label: "Esperando" },
];

const getTypeIcon = (type: string) => {
  if (type === "ENTRADA") return <FaDoorOpen />;
  if (type === "SALIDA") return <FaSignOutAlt />;
  return <FaCashRegister />;
};

const formatCoordinates = (coordinates?: [number, number]) =>
  coordinates ? `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}` : "Sin coordenadas";

export function DeviceHeartbeatPage() {
  usePageTitle("Heartbeat");

  const [statusFilter, setStatusFilter] = useState<DeviceHeartbeatFilter>("all");
  const { modules, isLoading, error, fetchModules } = useModules();

  const activeModules = useMemo(
    () => modules.filter((module) => module.estado),
    [modules],
  );
  const stats = useMemo(() => buildHeartbeatStats(activeModules), [activeModules]);
  const filteredModules = useMemo(
    () =>
      activeModules.filter((module) => {
        if (statusFilter === "all") return true;
        return resolveDeviceStatus(module.deviceRuntime) === statusFilter;
      }),
    [activeModules, statusFilter],
  );

  if (isLoading) {
    return <ScreenLoader label="heartbeat" fullscreen={false} />;
  }

  return (
    <main className="device-heartbeat-page">
      <section className="device-heartbeat-hero">
        <div>
          <span className="device-heartbeat-eyebrow">Monitoreo local</span>
          <h1>Heartbeat de dispositivos</h1>
          <p>
            Supervisa el estado de entradas, salidas, POS y perifericos reportados por cada modulo.
          </p>
        </div>

        <button
          type="button"
          className="device-heartbeat-refresh"
          onClick={() => void fetchModules()}
        >
          <FaSyncAlt />
          Actualizar
        </button>
      </section>

      <section className="device-heartbeat-stats" aria-label="Resumen de dispositivos">
        <article>
          <span>Total</span>
          <strong>{stats.total}</strong>
          <small>modulos activos</small>
        </article>
        <article className="is-online">
          <span>Online</span>
          <strong>{stats.online}</strong>
          <small>heartbeat fresco</small>
        </article>
        <article className="is-offline">
          <span>Offline</span>
          <strong>{stats.offline}</strong>
          <small>requieren revision</small>
        </article>
        <article className="is-pending">
          <span>Esperando</span>
          <strong>{stats.pending}</strong>
          <small>sin runtime</small>
        </article>
        <article>
          <span>Perifericos</span>
          <strong>{stats.submodules}</strong>
          <small>submodulos registrados</small>
        </article>
      </section>

      <section className="device-heartbeat-toolbar">
        <div>
          <strong>Vista operativa</strong>
          <span>{filteredModules.length} dispositivos visibles</span>
        </div>

        <div className="device-heartbeat-filters" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={statusFilter === filter.id ? "is-active" : ""}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p className="device-heartbeat-error">
          <FaExclamationTriangle />
          {error}
        </p>
      ) : null}

      {filteredModules.length === 0 ? (
        <section className="device-heartbeat-empty">
          <FaBroadcastTower />
          <h2>Sin dispositivos para mostrar</h2>
          <p>No hay modulos que coincidan con el filtro seleccionado.</p>
        </section>
      ) : (
        <section className="device-heartbeat-grid">
          {filteredModules.map((module) => {
            const status = resolveDeviceStatus(module.deviceRuntime);
            const runtime = module.deviceRuntime;

            return (
              <article key={module.id} className={`device-heartbeat-card is-${status}`}>
                <header>
                  <span className="device-heartbeat-card__icon">{getTypeIcon(module.tipo)}</span>
                  <div>
                    <h2>{module.nombre}</h2>
                    <p>{module.identificador} · {getModuleTypeLabel(module.tipo)}</p>
                  </div>
                  <span className={`device-heartbeat-pill is-${status}`}>
                    {getStatusLabel(status)}
                  </span>
                </header>

                <div className="device-heartbeat-card__runtime">
                  <span>
                    Estado
                    <strong>{runtime?.connectionStatus ?? "Sin runtime"}</strong>
                  </span>
                  <span>
                    Heartbeat
                    <strong>{getHeartbeatAgeLabel(runtime?.lastHeartbeatAt)}</strong>
                  </span>
                  <span>
                    IP
                    <strong>{runtime?.ipAddress || module.deviceBinding?.primaryMac || "Sin dato"}</strong>
                  </span>
                  <span>
                    Binding
                    <strong>{getBindingLabel(module)}</strong>
                  </span>
                  <span>
                    Red local
                    <strong>{module.ip || "Sin IP configurada"}</strong>
                  </span>
                  <span>
                    Ubicacion
                    <strong>{module.ubicacion || "Sin ubicacion"}</strong>
                  </span>
                </div>

                <p className="device-heartbeat-card__message">{getStatusHint(module)}</p>

                <div className="device-heartbeat-card__meta">
                  <span>Conectado: {formatDateTime(runtime?.connectedAt)}</span>
                  <span>Ultimo heartbeat: {formatDateTime(runtime?.lastHeartbeatAt)}</span>
                  <span>Coordenadas: {formatCoordinates(module.coordinates)}</span>
                </div>

                <div className="device-heartbeat-submodules">
                  <span className="device-heartbeat-submodules__title">
                    <FaPlug />
                    Submodulos
                  </span>
                  {module.submodulos.length ? (
                    <div className="device-heartbeat-submodules__list">
                      {module.submodulos.map((submodule) => (
                        <span
                          key={submodule.submoduloId}
                          className={submodule.estado ? "is-active" : "is-inactive"}
                        >
                          <FaQrcode />
                          <span className="device-heartbeat-submodules__copy">
                            <strong>{submodule.nombre}</strong>
                            <small>{submodule.tipo}</small>
                            <small><FaWifi /> {submodule.ip || "Sin IP"}</small>
                            <small><FaMapMarkerAlt /> {submodule.ubicacion || "Sin ubicacion"}</small>
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>Sin perifericos registrados.</p>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
