import {
  BaseCombobox,
  type ComboOption,
} from "../shared/BaseCombobox/BaseCombobox";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaBoxOpen,
  FaCashRegister,
  FaArrowCircleDown,
  FaArrowCircleUp,
  FaLock,
  FaTimes,
} from "react-icons/fa";
import { formatMoney } from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterDenominationLine,
  CashRegisterShiftDetail,
  CashierOption,
} from "../../types/cashPayments/cash-payments.types";
import "../../styles/cashPayments/CashRegisterPanel.css";

type Props = {
  activeShiftDetail: CashRegisterShiftDetail | null;
  availableCashierOptions: ComboOption[];
  countNotes: string;
  denominationLines: CashRegisterDenominationLine[];
  error: string | null;
  loading: boolean;
  loadingCashiers: boolean;
  loadingShift: boolean;
  movementAmount: string;
  movementConcept: string;
  movementType: "manual_income" | "manual_expense";
  openingAmount: string;
  openingNotes: string;
  selectedCashier: CashierOption | null;
  selectedCashierId: string;
  successMessage: string | null;
  onCloseShift: () => void;
  onOpenShift: () => void;
  onRegisterManualMovement: () => void;
  onSetCountNotes: (value: string) => void;
  onSetMovementAmount: (value: string) => void;
  onSetMovementConcept: (value: string) => void;
  onSetMovementType: (value: "manual_income" | "manual_expense") => void;
  onSetOpeningAmount: (value: string) => void;
  onSetOpeningNotes: (value: string) => void;
  onSetSelectedCashierId: (value: string) => void;
  onUpdateDenominationQuantity: (index: number, value: string) => void;
};

export function CashRegisterPanel({
  activeShiftDetail,
  availableCashierOptions,
  countNotes,
  denominationLines,
  error,
  loading,
  loadingCashiers,
  loadingShift,
  movementAmount,
  movementConcept,
  movementType,
  openingAmount,
  openingNotes,
  selectedCashier,
  selectedCashierId,
  successMessage,
  onCloseShift,
  onOpenShift,
  onRegisterManualMovement,
  onSetCountNotes,
  onSetMovementAmount,
  onSetMovementConcept,
  onSetMovementType,
  onSetOpeningAmount,
  onSetOpeningNotes,
  onSetSelectedCashierId,
  onUpdateDenominationQuantity,
}: Props) {
  const [isCutModalOpen, setIsCutModalOpen] = useState(false);
  const countedTotal = denominationLines.reduce(
    (sum, line) => sum + line.value * Math.max(0, Number(line.quantity || 0)),
    0,
  );
  const projectedDifference = activeShiftDetail
    ? Number((countedTotal - activeShiftDetail.summary.expectedAmount).toFixed(2))
    : 0;
  const shouldRenderCutModal =
    isCutModalOpen && activeShiftDetail && typeof document !== "undefined";

  useEffect(() => {
    if (!isCutModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCutModalOpen]);

  return (
    <section className="cash-register-panel cash-payments-panel">
      <div className="cash-payments-panel__header">
        <div className="cash-register-panel__title">
          <span className="cash-register-panel__title-icon" aria-hidden="true">
            <FaCashRegister />
          </span>
          <span>
            <h2>Turno y corte</h2>
            <small>Administra la apertura, movimientos y cierre de la caja.</small>
          </span>
        </div>
        {activeShiftDetail ? (
          <span className="cash-register-panel__badge">POS activo</span>
        ) : (
          <span className="cash-register-panel__badge cash-register-panel__badge--muted">
            Sin turno
          </span>
        )}
      </div>

      {error || successMessage ? (
        <div className="cash-payments-feedback">
          {error ? (
            <div className="cash-payments-alert cash-payments-alert--error">{error}</div>
          ) : null}
          {successMessage ? (
            <div className="cash-payments-alert cash-payments-alert--success">
              {successMessage}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="cash-register-panel__content">
        <section className="cash-register-card cash-register-card--setup">
          <div className="cash-register-card__header">
            <h3>Seleccionar POS</h3>
            {loadingShift ? (
              <span className="cash-register-panel__helper">Revisando turno...</span>
            ) : null}
          </div>
          <label>
            Caja POS
            <BaseCombobox
              placeholder="Buscar caja"
              allLabel={loadingCashiers ? "Cargando cajas..." : "Selecciona una caja"}
              iconTitle="Seleccionar caja"
              options={availableCashierOptions}
              value={selectedCashierId || undefined}
              onChange={(id) => onSetSelectedCashierId(id ?? "")}
              renderInPortal
              showAllOption={false}
            />
          </label>

          {!activeShiftDetail ? (
            <>
              <div className="cash-register-card__fields">
                <label>
                  Fondo inicial
                  <input
                    value={openingAmount}
                    onChange={(event) => onSetOpeningAmount(event.target.value)}
                    placeholder="0"
                  />
                </label>
                <label>
                  Nota inicial
                  <input
                    value={openingNotes}
                    onChange={(event) => onSetOpeningNotes(event.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>
              <button
                type="button"
                className="cash-register-card__action cash-register-card__action--open"
                onClick={onOpenShift}
                disabled={loading || loadingShift || !selectedCashierId}
              >
                <FaBoxOpen /> Abrir turno
              </button>
            </>
          ) : (
            <p className="cash-payments-panel__caption">
              {selectedCashier
                ? `${selectedCashier.identificador} - ${selectedCashier.nombre} ya tiene un turno abierto.`
                : "La caja seleccionada ya tiene un turno abierto."}
            </p>
          )}
        </section>

        {activeShiftDetail ? (
          <>
          <div className="cash-register-panel__summary">
            <article className="cash-register-summary-card cash-register-summary-card--opening">
              <span>Fondo inicial</span>
              <strong>{formatMoney(activeShiftDetail.summary.openingAmount)}</strong>
            </article>
            <article className="cash-register-summary-card cash-register-summary-card--income">
              <span>Ingresos</span>
              <strong>{formatMoney(activeShiftDetail.summary.totalIn)}</strong>
            </article>
            <article className="cash-register-summary-card cash-register-summary-card--expense">
              <span>Salidas</span>
              <strong>{formatMoney(activeShiftDetail.summary.totalOut)}</strong>
            </article>
            <article className="cash-register-summary-card cash-register-summary-card--expected">
              <span>Esperado</span>
              <strong>{formatMoney(activeShiftDetail.summary.expectedAmount)}</strong>
            </article>
          </div>

          <div className="cash-register-panel__grid">
            <section className="cash-register-card">
              <div className="cash-register-card__header">
                <h3>Movimiento manual</h3>
              </div>
              <div className="cash-register-card__type-toggle">
                <button
                  type="button"
                  className={movementType === "manual_income" ? "is-active" : ""}
                  onClick={() => onSetMovementType("manual_income")}
                >
                  <FaArrowCircleDown /> Ingreso
                </button>
                <button
                  type="button"
                  className={movementType === "manual_expense" ? "is-active" : ""}
                  onClick={() => onSetMovementType("manual_expense")}
                >
                  <FaArrowCircleUp /> Salida
                </button>
              </div>
              <div className="cash-register-card__fields">
                <label>
                  Concepto
                  <input
                    value={movementConcept}
                    onChange={(event) => onSetMovementConcept(event.target.value)}
                    placeholder="Ej. retiro para cambio"
                  />
                </label>
                <label>
                  Importe
                  <input
                    value={movementAmount}
                    onChange={(event) => onSetMovementAmount(event.target.value)}
                    placeholder="0"
                  />
                </label>
              </div>
              <button
                type="button"
                className="cash-register-card__action cash-register-card__action--movement"
                onClick={onRegisterManualMovement}
                disabled={loading}
              >
                Registrar movimiento
              </button>
            </section>

            <section className="cash-register-card cash-register-card--close">
              <div className="cash-register-card__header">
                <h3>Cierre de turno</h3>
                <span className="cash-register-panel__helper">
                  Conteo fisico al finalizar
                </span>
              </div>
              <div className="cash-register-panel__summary cash-register-panel__summary--compact">
                <article>
                  <span>Esperado</span>
                  <strong>{formatMoney(activeShiftDetail.summary.expectedAmount)}</strong>
                </article>
                <article>
                  <span>Contado</span>
                  <strong>{formatMoney(countedTotal)}</strong>
                </article>
              </div>
              <button
                type="button"
                className="cash-register-card__action cash-register-card__action--danger"
                onClick={() => setIsCutModalOpen(true)}
                disabled={loading}
              >
                <FaLock /> Cerrar turno
              </button>
            </section>
          </div>

          {shouldRenderCutModal ? createPortal(
            <div className="cash-register-cut-modal" role="dialog" aria-modal="true">
              <div
                className="cash-register-cut-modal__backdrop"
                onClick={() => setIsCutModalOpen(false)}
              />
              <section className="cash-register-cut-modal__card">
                <header className="cash-register-cut-modal__header">
                  <div>
                    <span className="cash-register-panel__badge">Corte de caja</span>
                    <h3>Contar efectivo y cerrar turno</h3>
                    <p>
                      Captura el dinero fisico que hay en caja. Revisa la diferencia
                      antes de confirmar el cierre.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cash-register-cut-modal__close"
                    onClick={() => setIsCutModalOpen(false)}
                    aria-label="Cerrar modal de corte"
                  >
                    <FaTimes />
                  </button>
                </header>

                <div className="cash-register-panel__summary">
                  <article>
                    <span>Esperado</span>
                    <strong>{formatMoney(activeShiftDetail.summary.expectedAmount)}</strong>
                  </article>
                  <article>
                    <span>Contado</span>
                    <strong>{formatMoney(countedTotal)}</strong>
                  </article>
                  <article>
                    <span>Diferencia</span>
                    <strong>{formatMoney(projectedDifference)}</strong>
                  </article>
                </div>

                <div className="cash-register-card__denoms">
                  {denominationLines.map((line, index) => (
                    <label key={line.label}>
                      <span>{line.label}</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) =>
                          onUpdateDenominationQuantity(index, event.target.value)
                        }
                        placeholder="0"
                      />
                    </label>
                  ))}
                </div>

                <label className="cash-register-cut-modal__note">
                  Nota de corte
                  <input
                    value={countNotes}
                    onChange={(event) => onSetCountNotes(event.target.value)}
                    placeholder={
                      projectedDifference !== 0
                        ? "Obligatoria si hay diferencia"
                        : "Opcional"
                    }
                  />
                </label>

                <div className="cash-register-card__actions cash-register-cut-modal__actions">
                  <button
                    type="button"
                    className="cash-register-card__action cash-register-card__action--danger"
                    onClick={onCloseShift}
                    disabled={loading}
                  >
                    <FaLock /> Confirmar cierre
                  </button>
                </div>
              </section>
            </div>,
            document.body
          ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
