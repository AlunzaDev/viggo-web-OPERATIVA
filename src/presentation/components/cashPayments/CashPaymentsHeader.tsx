import {
  formatDateTime,
  formatMoney,
  formatSessionStatus,
  STEPS,
} from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterShiftDetail,
  CashSession,
  CashierOption,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";
import "../../styles/cashPayments/CashPaymentsHeader.css";

type Props = {
  currentStepIndex: number;
  isTicketPaid: boolean;
  pendingAmount: number;
  projectNameById: Map<string, string>;
  resolvedTicket: TicketView | null;
  section?: "checkout" | "shift";
  activeShiftDetail?: CashRegisterShiftDetail | null;
  selectedCashier: CashierOption | null;
  session: CashSession | null;
};

export function CashPaymentsHeader({
  activeShiftDetail,
  currentStepIndex,
  isTicketPaid,
  pendingAmount,
  projectNameById,
  resolvedTicket,
  section = "checkout",
  selectedCashier,
  session,
}: Props) {
  if (section === "shift") {
    return (
      <section className="cash-payments-hero">
        <div className="cash-payments-hero__content">
          <p className="cash-payments-hero__eyebrow">Operacion de caja</p>
          <h1>Turno de caja POS</h1>

          <div className="cash-payments-hero__stats">
            <article className="cash-payments-stat">
              <span>POS seleccionado</span>
              <strong>
                {selectedCashier
                  ? `${selectedCashier.identificador} - ${selectedCashier.nombre}`
                  : "Sin seleccionar"}
              </strong>
            </article>
            <article className="cash-payments-stat">
              <span>Turno</span>
              <strong>{activeShiftDetail ? "Abierto" : "Sin turno"}</strong>
            </article>
            <article className="cash-payments-stat">
              <span>Disponible</span>
              <strong>
                {formatMoney(activeShiftDetail?.summary.expectedAmount ?? 0)}
              </strong>
            </article>
          </div>

          <div className="cash-payments-hero__stats cash-payments-hero__stats--detail">
            <article className="cash-payments-stat">
              <span>Fondo inicial</span>
              <strong>{formatMoney(activeShiftDetail?.summary.openingAmount ?? 0)}</strong>
            </article>
            <article className="cash-payments-stat">
              <span>Ingresos</span>
              <strong>{formatMoney(activeShiftDetail?.summary.totalIn ?? 0)}</strong>
            </article>
            <article className="cash-payments-stat">
              <span>Salidas</span>
              <strong>{formatMoney(activeShiftDetail?.summary.totalOut ?? 0)}</strong>
            </article>
            <article className="cash-payments-stat">
              <span>Apertura</span>
              <strong>
                {activeShiftDetail ? formatDateTime(activeShiftDetail.shift.openedAt) : "Sin registro"}
              </strong>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cash-payments-hero">
      <div className="cash-payments-hero__content">
        <p className="cash-payments-hero__eyebrow">Operacion en caja</p>
        <h1>Cobro de boletos con efectivo</h1>

        <ol className="cash-payments-stepper">
          {STEPS.map((step, index) => {
            const state =
              index < currentStepIndex
                ? "done"
                : index === currentStepIndex
                  ? "active"
                  : "pending";

            return (
              <li
                key={step.key}
                className={`cash-payments-stepper__item cash-payments-stepper__item--${state}`}
              >
                <span className="cash-payments-stepper__circle">
                  {state === "done" ? "OK" : index + 1}
                </span>
                <span className="cash-payments-stepper__label">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="cash-payments-hero__stats">
          <article className="cash-payments-stat">
            <span>Boleto</span>
            <strong>{resolvedTicket?.idBoleto || "Sin resolver"}</strong>
          </article>
          <article className="cash-payments-stat">
            <span>Saldo pendiente</span>
            <strong>{formatMoney(pendingAmount)}</strong>
          </article>
          <article className="cash-payments-stat">
            <span>Cobro</span>
            <strong>{session ? formatSessionStatus(session.status) : "Sin cobro"}</strong>
          </article>
        </div>

        {resolvedTicket ? (
          <div className="cash-payments-hero__stats cash-payments-hero__stats--detail">
            <article className="cash-payments-stat">
              <span>Proyecto</span>
              <strong>
                {projectNameById.get(resolvedTicket.proyecto) ??
                  resolvedTicket.proyecto ??
                  "Sin proyecto"}
              </strong>
            </article>
            <article className="cash-payments-stat">
              <span>Entrada</span>
              <strong>{formatDateTime(resolvedTicket.horaInicio)}</strong>
            </article>
            <article className="cash-payments-stat">
              <span>Estado de pago</span>
              <strong>{isTicketPaid ? "Pagado" : "Pendiente"}</strong>
            </article>
            <article className="cash-payments-stat">
              <span>Caja activa</span>
              <strong>
                {selectedCashier
                  ? `${selectedCashier.identificador} - ${selectedCashier.nombre}`
                  : "Sin caja"}
              </strong>
            </article>
          </div>
        ) : null}
      </div>
    </section>
  );
}
