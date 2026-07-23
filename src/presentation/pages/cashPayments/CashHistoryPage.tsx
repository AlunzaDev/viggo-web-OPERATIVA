import { useEffect, useMemo, useState } from "react";
import { FaCashRegister, FaEye, FaFilter, FaSyncAlt } from "react-icons/fa";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import {
  formatCutStatus,
  formatDateTime,
  formatMoney,
  formatMovementType,
  formatShiftStatus,
  getErrorMessage,
  getNumber,
} from "../../utils/cashPayments/cash-payments.formatters";
import {
  getCashRegisterShiftDetail,
  getCashRegisterShiftStats,
  listCashRegisterShiftSummaries,
  type CashRegisterShiftFilters,
} from "../../services/cashPayments/cash-payments.api";
import type {
  CashRegisterShiftAggregate,
  CashRegisterShiftDetail,
} from "../../types/cashPayments/cash-payments.types";
import "../../styles/cashPayments/CashHistoryPage.css";

type ShiftStatusFilter = "all" | "open" | "closed" | "reconciled" | "cancelled";

const PAGE_SIZE = 20;

const defaultAggregate: CashRegisterShiftAggregate = {
  totalShifts: 0,
  openShifts: 0,
  closedShifts: 0,
  openingAmount: 0,
  totalIn: 0,
  totalOut: 0,
  expectedAmount: 0,
  countedAmount: 0,
  differenceAmount: 0,
};

const toStartOfDay = (date: string) => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : undefined;
};

const toEndOfDay = (date: string) => {
  if (!date) return undefined;
  const parsed = new Date(`${date}T23:59:59.999`);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : undefined;
};

const getCashierLabel = (detail: CashRegisterShiftDetail) =>
  [detail.shift.moduloIdentificador, detail.shift.moduloNombre]
    .filter(Boolean)
    .join(" - ") || detail.shift.moduloId;

const getMovementDetail = (movement: CashRegisterShiftDetail["movements"][number]) => {
  const received = getNumber(movement.metadata?.amountReceived, NaN);
  const change = getNumber(movement.metadata?.changeAmount, NaN);

  if (Number.isFinite(received)) {
    return `Recibido ${formatMoney(received)}${
      Number.isFinite(change) ? ` · Cambio ${formatMoney(change)}` : ""
    }`;
  }

  return movement.notes || movement.concept;
};

export function CashHistoryPage() {
  usePageTitle("Historial de Caja");

  const [status, setStatus] = useState<ShiftStatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [items, setItems] = useState<CashRegisterShiftDetail[]>([]);
  const [aggregate, setAggregate] =
    useState<CashRegisterShiftAggregate>(defaultAggregate);
  const [selectedDetail, setSelectedDetail] =
    useState<CashRegisterShiftDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const queryParams = useMemo((): CashRegisterShiftFilters => {
    const params: CashRegisterShiftFilters = {
      includeSummary: true,
      page: 1,
      limit: PAGE_SIZE,
    };

    if (status !== "all") params.status = status;
    const from = toStartOfDay(dateFrom);
    const to = toEndOfDay(dateTo);
    if (from) params.dateFrom = from;
    if (to) params.dateTo = to;

    return params;
  }, [dateFrom, dateTo, status]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const [listResponse, summaryResponse] = await Promise.all([
        listCashRegisterShiftSummaries(queryParams),
        getCashRegisterShiftStats(queryParams),
      ]);

      setItems(listResponse.items);
      setTotal(listResponse.total);
      setAggregate(summaryResponse);
      setSelectedDetail((current) => {
        if (!current) return listResponse.items[0] ?? null;
        return (
          listResponse.items.find((item) => item.shift.id === current.shift.id) ??
          null
        );
      });
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
      setSelectedDetail(await getCashRegisterShiftDetail(shiftId));
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
        <button type="button" onClick={loadHistory} disabled={loading}>
          <FaSyncAlt /> Actualizar
        </button>
      </section>

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

      <section className="cash-history-filters">
        <span>
          <FaFilter /> Filtros
        </span>
        <label>
          Estado
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ShiftStatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="open">Abiertos</option>
            <option value="closed">Cerrados</option>
            <option value="reconciled">Conciliados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </label>
        <label>
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
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
                  onClick={() => loadDetail(item.shift.id)}
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
    </main>
  );
}
