import {
  formatDateTime,
  formatMovementType,
  formatMoney,
  formatShiftStatus,
  formatSessionEventType,
  formatSessionStatus,
} from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterShiftDetail,
  CashSession,
} from "../../types/cashPayments/cash-payments.types";
import "../../styles/cashPayments/CashPaymentsSessionPanel.css";

type Props = {
  activeShiftDetail: CashRegisterShiftDetail | null;
  session: CashSession | null;
};

export function CashPaymentsSessionPanel({ activeShiftDetail, session }: Props) {
  return (
    <aside className="cash-payments-panel">
      <div className="cash-payments-panel__header">
        <h2>Cobro activo</h2>
        <span
          className={`cash-payments-session__status cash-payments-session__status--${session?.status ?? "created"}`}
        >
          {session ? formatSessionStatus(session.status) : "Sin cobro"}
        </span>
      </div>

      {session ? (
        <>
          <p className="cash-payments-panel__caption">
            Aqui ves el estado del cobro y la trazabilidad que va dejando el flujo de
            efectivo.
          </p>
          <section className="cash-payments-session">
            <div className="cash-payments-session__summary">
              <article>
                <span>Total</span>
                <strong>{formatMoney(session.amountExpected)}</strong>
              </article>
              <article>
                <span>Recibido</span>
                <strong>{formatMoney(session.amountReceived)}</strong>
              </article>
              <article>
                <span>Cambio</span>
                <strong>{formatMoney(session.changeAmount)}</strong>
              </article>
              <article>
                <span>Caja</span>
                <strong>
                  {session.moduloIdentificador || session.moduloNombre
                    ? `${session.moduloIdentificador ?? "Caja"}${session.moduloNombre ? ` - ${session.moduloNombre}` : ""}`
                    : session.deviceId || "Sin caja"}
                </strong>
              </article>
              <article>
                <span>Iniciado</span>
                <strong>{formatDateTime(session.startedAt)}</strong>
              </article>
            </div>

            <div className="cash-payments-events">
              {session.events.length > 0 ? (
                session.events
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <article key={`${event.type}-${event.createdAt}-${index}`}>
                      <header>
                        <strong>{formatSessionEventType(event.type)}</strong>
                        <time>{formatDateTime(event.createdAt)}</time>
                      </header>
                      <p>
                        {event.amount !== undefined
                          ? `Monto: ${formatMoney(event.amount)}`
                          : "Sin importe registrado"}
                      </p>
                    </article>
                  ))
              ) : (
                <article>
                  <header>
                    <strong>Sin eventos</strong>
                  </header>
                  <p>El cobro todavia no registra movimientos.</p>
                </article>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="cash-payments-session cash-payments-session--empty">
          <div className="cash-payments-session__empty-copy">
            {activeShiftDetail ? (
              <>
                <div className="cash-payments-panel__header cash-payments-panel__header--compact">
                  <h3>POS listo para cobrar</h3>
                  <span className="cash-payments-session__status cash-payments-session__status--open">
                    {formatShiftStatus(activeShiftDetail.shift.status)}
                  </span>
                </div>
                <p className="cash-payments-panel__caption">
                  La caja ya esta abierta. Escanea un boleto para registrar el siguiente cobro.
                </p>
                <div className="cash-payments-session__summary">
                  <article>
                    <span>Fondo</span>
                    <strong>{formatMoney(activeShiftDetail.summary.openingAmount)}</strong>
                  </article>
                  <article>
                    <span>Ingresos</span>
                    <strong>{formatMoney(activeShiftDetail.summary.totalIn)}</strong>
                  </article>
                  <article>
                    <span>Salidas</span>
                    <strong>{formatMoney(activeShiftDetail.summary.totalOut)}</strong>
                  </article>
                  <article>
                    <span>Disponible</span>
                    <strong>{formatMoney(activeShiftDetail.summary.expectedAmount)}</strong>
                  </article>
                  <article>
                    <span>Apertura</span>
                    <strong>{formatDateTime(activeShiftDetail.shift.openedAt)}</strong>
                  </article>
                </div>
                <div className="cash-payments-events">
                  {activeShiftDetail.movements.length > 0 ? (
                    activeShiftDetail.movements
                      .slice(0, 4)
                      .map((movement) => (
                        <article key={movement.id}>
                          <header>
                            <strong>{formatMovementType(movement.type)}</strong>
                            <time>{formatDateTime(movement.createdAt)}</time>
                          </header>
                          <p>
                            {movement.concept} · {formatMoney(movement.amount)}
                          </p>
                        </article>
                      ))
                  ) : (
                    <article>
                      <header>
                        <strong>Turno recien abierto</strong>
                      </header>
                      <p>Todavia no hay movimientos registrados en esta caja.</p>
                    </article>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3>Sin POS listo</h3>
                <p className="cash-payments-panel__caption">
                  Selecciona una caja y abre su turno para empezar a cobrar.
                </p>
              </>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}
