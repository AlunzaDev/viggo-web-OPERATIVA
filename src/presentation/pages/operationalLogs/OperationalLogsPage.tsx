import { useEffect, useMemo, useState } from "react";
import {
  FaBroadcastTower,
  FaDoorOpen,
  FaExclamationTriangle,
  FaFilter,
  FaQrcode,
  FaSyncAlt,
  FaWallet,
} from "react-icons/fa";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { FilterSidebar } from "../../components/shared/FilterSidebar";
import { SidebarFilterField, SidebarFilterForm } from "../../components/shared/SidebarFilterForm";
import { OperationalLogDetailModal, type OperationalLogDetailItem } from "../../components/shared/operationalLogs/OperationalLogDetailModal";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { ScreenLoader } from "../../components/shared/loading/ScreenLoader";
import {
  buildOperationalLogsStats,
  filterOperationalLogsByQuickFilter,
  getKindLabel,
  getSeverityLabel,
  loadOperationalLogsFlow,
  QUICK_FILTERS,
  type OperationalQuickFilterId,
} from "../../services/operationalLogs/operational-logs.flow";
import type { LogScope, OperationalLogsSummary } from "../../services/operationalLogs/operational-logs.api";
import { normalizeOperationalUserMessage } from "../../services/operations/operational-state.presenter";
import "./OperationalLogsPage.css";

type OperationalLogItem = OperationalLogDetailItem;

const KIND_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "event", label: "Eventos" },
  { value: "incident", label: "Incidencias" },
] as const;

const SCOPE_OPTIONS = [
  { value: "", label: "Todos los flujos" },
  { value: "payment", label: "Pagos" },
  { value: "device", label: "Dispositivos" },
  { value: "access_flow", label: "Acceso" },
  { value: "system", label: "Sistema" },
] as const;

const SEVERITY_OPTIONS = [
  { value: "", label: "Todas las severidades" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Advertencia" },
  { value: "critical", label: "Critica" },
] as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});
const getScopeLabel = (scope: LogScope) =>
  ({
    payment: "Pago",
    device: "Dispositivo",
    access_flow: "Acceso",
    system: "Sistema",
  })[scope] ?? scope;

const getSourceLabel = (source: OperationalLogItem["source"]) =>
  ({
    backend: "Backend",
    device: "Device",
    app: "App",
    sync: "Sync",
    system: "Sistema",
  })[source] ?? source;

const getQuickFilterIcon = (filterId: (typeof QUICK_FILTERS)[number]["id"]) => {
  if (filterId === "qr") return <FaQrcode />;
  if (filterId === "cash") return <FaWallet />;
  if (filterId === "barrier") return <FaDoorOpen />;
  if (filterId === "heartbeat") return <FaBroadcastTower />;
  return <FaFilter />;
};

const getTypeTone = (type: string) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("qr")) return "qr";
  if (normalizedType.includes("cash") || normalizedType.includes("payment")) return "cash";
  if (
    normalizedType.includes("barrier") ||
    normalizedType.includes("vehicle") ||
    normalizedType.includes("loop")
  ) {
    return "barrier";
  }
  if (
    normalizedType.includes("heartbeat") ||
    normalizedType.includes("device") ||
    normalizedType.includes("socket")
  ) {
    return "heartbeat";
  }
  return "default";
};

const formatLogContext = (item: OperationalLogItem) => {
  const parts = [
    item.projectName,
    item.moduloNombre,
    item.ticketId ? `Ticket ${item.ticketId.slice(-6)}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Sin contexto adicional";
};

const formatMetadataValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export function OperationalLogsPage() {
  usePageTitle("Bitacora operativa");

  const [logs, setLogs] = useState<OperationalLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<OperationalLogsSummary>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [kind, setKind] = useState("");
  const [scope, setScope] = useState("");
  const [severity, setSeverity] = useState("");
  const [draftKind, setDraftKind] = useState("");
  const [draftScope, setDraftScope] = useState("");
  const [draftSeverity, setDraftSeverity] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<OperationalQuickFilterId>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLog, setSelectedLog] = useState<OperationalLogItem | null>(null);

  useEffect(() => {
    let active = true;

    const fetchLogs = async () => {
      if (active) {
        if (logs.length === 0) setIsLoading(true);
        else setIsRefreshing(true);
      }

      try {
        const result = await loadOperationalLogsFlow({
          page,
          search: appliedSearch,
          kind,
          scope,
          severity,
        });

        if (!active) return;

        setLogs(result.items);
        setTotalPages(result.totalPages);
        setSummary(result.summary);
        setError(
          result.error
            ? normalizeOperationalUserMessage(result.error, "operational_logs").message
            : "",
        );
      } finally {
        if (!active) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    void fetchLogs();

    return () => {
      active = false;
    };
  }, [appliedSearch, kind, logs.length, page, refreshKey, scope, severity]);

  const stats = useMemo(
    () => buildOperationalLogsStats(logs, summary),
    [logs, summary],
  );

  const visibleLogs = useMemo(() => {
    return filterOperationalLogsByQuickFilter(logs, quickFilter);
  }, [logs, quickFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (kind) count += 1;
    if (scope) count += 1;
    if (severity) count += 1;
    return count;
  }, [kind, scope, severity]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleRefresh = () => {
    setPage(1);
    setRefreshKey((value) => value + 1);
  };

  if (isLoading) {
    return <ScreenLoader label="bitacora operativa" fullscreen={false} />;
  }

  return (
    <main className="operational-logs-page">
      <section className="operational-logs-hero">
        <div>
          <span className="operational-logs-eyebrow">Seguimiento local</span>
          <h1>Bitacora operativa</h1>
          <p>
            Aqui puedes revisar lo que va pasando con cobros, QR, devices y eventos clave del
            punto local.
          </p>
        </div>

      </section>

      <CrudActionsIsland
        searchValue={search}
        onSearchChange={(event) => setSearch(event.target.value)}
        onSearchClear={() => {
          setSearch("");
          setAppliedSearch("");
          setPage(1);
        }}
        searchPlaceholder="Buscar por mensaje, tipo o ticket"
        showFilter
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => {
          setDraftKind(kind);
          setDraftScope(scope);
          setDraftSeverity(severity);
          setIsFilterOpen((prev) => !prev);
        }}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setKind("");
          setScope("");
          setSeverity("");
          setDraftKind("");
          setDraftScope("");
          setDraftSeverity("");
          setPage(1);
        }}
        className="operational-logs-island"
        middleActions={(
          <button
            type="button"
            className="crud-actions-island__action-btn crud-actions-island__action-btn--mobile-label"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <FaSyncAlt className={isRefreshing ? "is-spinning" : ""} />
            <span>Actualizar</span>
          </button>
        )}
      />

      <section className="operational-logs-stats" aria-label="Resumen de actividad">
        {stats.map((stat) => (
          <article key={stat.label} className={`is-${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.helper}</small>
          </article>
        ))}
      </section>

      <section className="operational-logs-quick-filters" aria-label="Filtros rapidos">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={quickFilter === filter.id ? "is-active" : ""}
            onClick={() => setQuickFilter(filter.id)}
          >
            {getQuickFilterIcon(filter.id)}
            {filter.label}
          </button>
        ))}
      </section>

      {error ? (
        <p className="operational-logs-error">
          <FaExclamationTriangle />
          {error}
        </p>
      ) : null}

      {visibleLogs.length === 0 ? (
        <section className="operational-logs-empty">
          <FaBroadcastTower />
          <h2>Sin movimientos por mostrar</h2>
          <p>No hay registros que coincidan con los filtros actuales.</p>
        </section>
      ) : (
        <section className="operational-logs-list">
          {visibleLogs.map((item) => (
            <article
              key={item.id}
              className={`operational-log-card is-${item.severity}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedLog(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedLog(item);
                }
              }}
            >
              <header className="operational-log-card__header">
                <div className="operational-log-card__title">
                  <span className={`operational-log-kind is-${item.kind}`}>
                    {item.kind === "incident" ? <FaBroadcastTower /> : <FaWallet />}
                    {getKindLabel(item.kind)}
                  </span>
                  <h2>{item.message}</h2>
                  <p>{formatLogContext(item)}</p>
                </div>

                <div className="operational-log-card__badges">
                  <span className={`is-type-${getTypeTone(item.type)}`}>{item.type}</span>
                  <span>{getScopeLabel(item.scope)}</span>
                  <span>{getSeverityLabel(item.severity)}</span>
                  <span>{getSourceLabel(item.source)}</span>
                </div>
              </header>

              <div className="operational-log-card__meta">
                <span>
                  <strong>Fecha</strong>
                  {dateFormatter.format(new Date(item.createdAt))}
                </span>
                <span>
                  <strong>Sesion</strong>
                  {item.paymentSessionId ? item.paymentSessionId.slice(-8) : "Sin sesion"}
                </span>
              </div>

              {item.metadata ? (
                <div className="operational-log-card__details">
                  {Object.entries(item.metadata)
                    .filter(([, value]) => value !== undefined && value !== null && value !== "")
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <span key={key}>
                        <strong>{key}</strong>
                        {formatMetadataValue(value)}
                      </span>
                    ))}
                </div>
              ) : null}

              <footer className="operational-log-card__footer">
                <span>
                  <FaQrcode />
                  {item.ticketId ? `Ticket ${item.ticketId}` : "Sin ticket asociado"}
                </span>
                <button
                  type="button"
                  className="operational-log-card__action"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedLog(item);
                  }}
                >
                  Ver detalle
                </button>
              </footer>
            </article>
          ))}
        </section>
      )}

      <section className="operational-logs-pagination">
        <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
          Anterior
        </button>
        <span>
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </section>

      <OperationalLogDetailModal
        open={Boolean(selectedLog)}
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />

      <FilterSidebar
        open={isFilterOpen}
        title="Filtros de bitacora"
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {
          setKind(draftKind);
          setScope(draftScope);
          setSeverity(draftSeverity);
          handleApplyFilters();
          setIsFilterOpen(false);
        }}
        onReset={() => {
          setDraftKind("");
          setDraftScope("");
          setDraftSeverity("");
        }}
      >
        <SidebarFilterForm>
          <SidebarFilterField label="Tipo" htmlFor="operational-logs-kind-filter">
            <select
              id="operational-logs-kind-filter"
              value={draftKind}
              onChange={(event) => setDraftKind(event.target.value)}
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SidebarFilterField>

          <SidebarFilterField label="Flujo" htmlFor="operational-logs-scope-filter">
            <select
              id="operational-logs-scope-filter"
              value={draftScope}
              onChange={(event) => setDraftScope(event.target.value)}
            >
              {SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SidebarFilterField>

          <SidebarFilterField label="Severidad" htmlFor="operational-logs-severity-filter">
            <select
              id="operational-logs-severity-filter"
              value={draftSeverity}
              onChange={(event) => setDraftSeverity(event.target.value)}
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SidebarFilterField>
        </SidebarFilterForm>
      </FilterSidebar>
    </main>
  );
}
