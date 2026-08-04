import { useEffect, useMemo, useState } from "react";
import { FaCashRegister, FaEye, FaSyncAlt } from "react-icons/fa";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { FilterSidebar } from "../../components/shared/FilterSidebar";
import { SidebarFilterField, SidebarFilterForm } from "../../components/shared/SidebarFilterForm";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import {
  formatCutStatus,
  formatDateTime,
  formatMoney,
  formatMovementType,
  formatShiftStatus,
  getErrorMessage,
} from "../../utils/cashPayments/cash-payments.formatters";
import {
  buildCashHistoryFilters,
  defaultCashShiftAggregate,
  getCashHistoryActiveFiltersCount,
  getCashierLabel,
  getMovementDetail,
  loadCashHistoryDetailFlow,
  loadCashHistoryFlow,
  resolveSelectedCashHistoryDetail,
  type ShiftStatusFilter,
} from "../../services/cashPayments/cash-history.flow";
import type {
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
} from "../../types/cashPayments/cash-payments.types";
import "../../styles/cashPayments/CashHistoryPage.css";

export function CashHistoryPage() {
  usePageTitle("Historial de Caja");

  const [status, setStatus] = useState<ShiftStatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [draftStatus, setDraftStatus] = useState<ShiftStatusFilter>("all");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [items, setItems] = useState<CashRegisterShiftDetail[]>([]);
  const [aggregate, setAggregate] =
    useState<CashRegisterShiftAggregate>(defaultCashShiftAggregate);
  const [selectedDetail, setSelectedDetail] =
    useState<CashRegisterShiftDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const activeFiltersCount = useMemo(
    () => getCashHistoryActiveFiltersCount({ status, dateFrom, dateTo }),
    [dateFrom, dateTo, status],
  );

  const queryParams = useMemo(
    () => buildCashHistoryFilters({ status, dateFrom, dateTo }),
    [dateFrom, dateTo, status],
  );

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await loadCashHistoryFlow(queryParams);
      setItems(history.items);
      setTotal(history.total);
      setAggregate(history.aggregate);
      setSelectedDetail((current) =>
        resolveSelectedCashHistoryDetail({
          current,
          items: history.items,
        }),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar el historial."));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (shiftId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      setSelectedDetail(await loadCashHistoryDetailFlow(shiftId));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar el detalle."));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [queryParams]);

  return (
    <main className="cash-history-page">
      <section className="cash-history-hero">
        <div>
          <span className="cash-history-eyebrow">Auditoria de caja</span>
          <h1>Historial de turnos POS</h1>
          <p>
            Revisa aperturas, cobros, movimientos, conteos y diferencias por caja.
          </p>
        </div>
      </section>

      <CrudActionsIsland
        showSearch={false}
        searchValue=""
        onSearchChange={() => undefined}
        showFilter
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => {
          setDraftStatus(status);
          setDraftDateFrom(dateFrom);
          setDraftDateTo(dateTo);
          setIsFilterOpen((prev) => !prev);
        }}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setStatus("all");
          setDateFrom("");
          setDateTo("");
          setDraftStatus("all");
          setDraftDateFrom("");
          setDraftDateTo("");
        }}
        className="cash-history-island"
        middleActions={(
          <button
            type="button"
            className="crud-actions-island__action-btn crud-actions-island__action-btn--mobile-label"
            onClick={loadHistory}
            disabled={loading}
          >
            <FaSyncAlt />
            <span>Actualizar</span>
          </button>
        )}
      />

      <section className="cash-history-kpis" aria-label="Resumen de caja">
        <article>
          <span>Turnos</span>
          <strong>{aggregate.totalShifts}</strong>
          <small>{aggregate.openShifts} abiertos</small>
        </article>
        <article>
          <span>Ingresos netos</span>
          <strong>{formatMoney(aggregate.totalIn)}</strong>
          <small>Sin contar fondo inicial</small>
        </article>
        <article>
          <span>Disponible esperado</span>
          <strong>{formatMoney(aggregate.expectedAmount)}</strong>
          <small>Fondo + ingresos - salidas</small>
        </article>
        <article>
          <span>Diferencia</span>
          <strong>{formatMoney(aggregate.differenceAmount)}</strong>
          <small>Conteo contra esperado</small>
        </article>
      </section>

      {error ? <div className="cash-history-alert">{error}</div> : null}

      <section className="cash-history-layout">
        <div className="cash-history-list">
          <div className="cash-history-list__header">
            <h2>Turnos recientes</h2>
            <span>{loading ? "Cargando..." : `${items.length} de ${total}`}</span>
          </div>

          {items.length === 0 ? (
            <div className="cash-history-empty">
              <FaCashRegister />
              <strong>No hay turnos con esos filtros</strong>
              <span>Cuando abras y cierres cajas, apareceran aqui.</span>
            </div>
          ) : (
            <div className="cash-history-table" role="table">
              <div className="cash-history-row cash-history-row--head" role="row">
                <span>Caja</span>
                <span>Usuario</span>
                <span>Estado</span>
                <span>Esperado</span>
                <span>Diferencia</span>
                <span>Apertura</span>
                <span>Detalle</span>
              </div>
              {items.map((item) => (
                <button
                  type="button"
                  className={`cash-history-row${
                    selectedDetail?.shift.id === item.shift.id ? " is-active" : ""
                  }`}
                  key={item.shift.id}
                  onClick={() => void loadDetail(item.shift.id)}
                  role="row"
                >
                  <span>{getCashierLabel(item)}</span>
                  <span>{item.shift.openedByUserName || item.shift.openedByUserId}</span>
                  <span>{formatShiftStatus(item.shift.status)}</span>
                  <span>{formatMoney(item.summary.expectedAmount)}</span>
                  <span>{formatMoney(item.summary.differenceAmount ?? 0)}</span>
                  <span>{formatDateTime(item.shift.openedAt)}</span>
                  <span className="cash-history-row__action">
                    <FaEye /> Ver
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="cash-history-detail">
          {selectedDetail ? (
            <>
              <div className="cash-history-detail__header">
                <div>
                  <span>{formatShiftStatus(selectedDetail.shift.status)}</span>
                  <h2>{getCashierLabel(selectedDetail)}</h2>
                  <p>
                    Abierto por{" "}
                    <strong>
                      {selectedDetail.shift.openedByUserName ||
                        selectedDetail.shift.openedByUserId}
                    </strong>
                  </p>
                </div>
                {detailLoading ? <small>Actualizando...</small> : null}
              </div>

              <div className="cash-history-detail__numbers">
                <article>
                  <span>Fondo</span>
                  <strong>{formatMoney(selectedDetail.summary.openingAmount)}</strong>
                </article>
                <article>
                  <span>Ingresos</span>
                  <strong>{formatMoney(selectedDetail.summary.totalIn)}</strong>
                </article>
                <article>
                  <span>Salidas</span>
                  <strong>{formatMoney(selectedDetail.summary.totalOut)}</strong>
                </article>
                <article>
                  <span>Esperado</span>
                  <strong>{formatMoney(selectedDetail.summary.expectedAmount)}</strong>
                </article>
                <article>
                  <span>Contado</span>
                  <strong>
                    {selectedDetail.summary.countedAmount === null
                      ? "Sin conteo"
                      : formatMoney(selectedDetail.summary.countedAmount)}
                  </strong>
                </article>
                <article>
                  <span>Diferencia</span>
                  <strong>
                    {selectedDetail.summary.differenceAmount === null
                      ? "Sin corte"
                      : formatMoney(selectedDetail.summary.differenceAmount)}
                  </strong>
                </article>
              </div>

              <div className="cash-history-detail__meta">
                <span>Apertura: {formatDateTime(selectedDetail.shift.openedAt)}</span>
                <span>Cierre: {formatDateTime(selectedDetail.shift.closedAt)}</span>
                <span>Corte: {formatCutStatus(selectedDetail.cut?.status)}</span>
              </div>

              <div className="cash-history-movements">
                <h3>Movimientos auditados</h3>
                {selectedDetail.movements.length === 0 ? (
                  <p>Este turno aun no tiene movimientos registrados.</p>
                ) : (
                  selectedDetail.movements.map((movement) => (
                    <article key={movement.id}>
                      <div>
                        <strong>{formatMovementType(movement.type)}</strong>
                        <span>{formatDateTime(movement.createdAt)}</span>
                      </div>
                      <p>{getMovementDetail(movement)}</p>
                      <b>{formatMoney(movement.amount)}</b>
                    </article>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="cash-history-empty cash-history-empty--detail">
              <FaCashRegister />
              <strong>Selecciona un turno</strong>
              <span>Aqui veras su auditoria completa.</span>
            </div>
          )}
        </aside>
      </section>

      <FilterSidebar
        open={isFilterOpen}
        title="Filtros de historial de caja"
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {
          setStatus(draftStatus);
          setDateFrom(draftDateFrom);
          setDateTo(draftDateTo);
          setIsFilterOpen(false);
        }}
        onReset={() => {
          setDraftStatus("all");
          setDraftDateFrom("");
          setDraftDateTo("");
        }}
      >
        <SidebarFilterForm>
          <SidebarFilterField label="Estado" htmlFor="cash-history-status-filter">
            <select
              id="cash-history-status-filter"
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value as ShiftStatusFilter)}
            >
              <option value="all">Todos</option>
              <option value="open">Abiertos</option>
              <option value="closed">Cerrados</option>
              <option value="reconciled">Conciliados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </SidebarFilterField>

          <SidebarFilterField label="Desde" htmlFor="cash-history-date-from">
            <input
              id="cash-history-date-from"
              type="date"
              value={draftDateFrom}
              onChange={(event) => setDraftDateFrom(event.target.value)}
            />
          </SidebarFilterField>

          <SidebarFilterField label="Hasta" htmlFor="cash-history-date-to">
            <input
              id="cash-history-date-to"
              type="date"
              value={draftDateTo}
              onChange={(event) => setDraftDateTo(event.target.value)}
            />
          </SidebarFilterField>
        </SidebarFilterForm>
      </FilterSidebar>
    </main>
  );
}
