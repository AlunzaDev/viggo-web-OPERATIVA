import { useEffect, useState, type KeyboardEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCashRegister,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaQrcode,
  FaUndo,
} from "react-icons/fa";
import {
  BaseCombobox,
  type ComboOption,
} from "../shared/BaseCombobox/BaseCombobox";
import { formatMoney, STEPS } from "../../utils/cashPayments/cash-payments.formatters";
import type {
  CashRegisterShiftDetail,
  CashSession,
  CashierOption,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";
import type { ScannerInputMeta } from "../../types/cashPayments/cash-payments.types";
import "../../styles/cashPayments/CashPaymentsWorkbench.css";

type Props = {
  activeShiftDetail: CashRegisterShiftDetail | null;
  availableCashierOptions: ComboOption[];
  currentStepIndex: number;
  error: string | null;
  insertAmount: string;
  isSessionClosed: boolean;
  loading: boolean;
  loadingCashiers: boolean;
  loadingShift: boolean;
  pendingAmount: number;
  projectedChange: number;
  qrInputRef: RefObject<HTMLInputElement | null>;
  qrValue: string;
  resolvedTicket: TicketView | null;
  scannerMeta: ScannerInputMeta;
  selectedCashier: CashierOption | null;
  selectedCashierId: string;
  session: CashSession | null;
  successMessage: string | null;
  amountInputRef: RefObject<HTMLInputElement | null>;
  onBackToCashierStep: () => void;
  onCancelCash: () => void;
  onHandleQrInputChange: (value: string) => void;
  onHandleQrInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInsertCash: () => void;
  onResetFlow: () => void;
  onResolveQr: () => void;
  onSetInsertAmount: (value: string) => void;
  onSetSelectedCashierId: (value: string) => void;
  onStartSession: () => void;
};

export function CashPaymentsWorkbench({
  activeShiftDetail,
  availableCashierOptions,
  currentStepIndex,
  error,
  insertAmount,
  isSessionClosed,
  loading,
  loadingCashiers,
  loadingShift,
  amountInputRef,
  pendingAmount,
  projectedChange,
  qrInputRef,
  qrValue,
  resolvedTicket,
  scannerMeta,
  selectedCashier,
  selectedCashierId,
  session,
  successMessage,
  onBackToCashierStep,
  onCancelCash,
  onHandleQrInputChange,
  onHandleQrInputKeyDown,
  onInsertCash,
  onResetFlow,
  onResolveQr,
  onSetInsertAmount,
  onSetSelectedCashierId,
  onStartSession,
}: Props) {
  const [isCashierComboboxOpen, setIsCashierComboboxOpen] = useState(false);
  const isShiftRequired =
    currentStepIndex === 0 && Boolean(selectedCashierId) && !loadingShift && !activeShiftDetail;

  useEffect(() => {
    if (isShiftRequired) {
      setIsCashierComboboxOpen(false);
    }
  }, [isShiftRequired]);

  return (
    <div className="cash-payments-panel">
      <h2>{STEPS[currentStepIndex].label}</h2>

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

      <div className="cash-payments-form">
        {currentStepIndex === 0 ? (
          <div className="cash-payments-quickbar">
            <label>
              Caja activa
              <BaseCombobox
                placeholder="Buscar caja"
                allLabel={loadingCashiers ? "Cargando cajas..." : "Selecciona una caja"}
                iconTitle="Seleccionar caja"
                options={availableCashierOptions}
                open={isCashierComboboxOpen}
                onOpenChange={setIsCashierComboboxOpen}
                value={selectedCashierId || undefined}
                onChange={(id) => onSetSelectedCashierId(id ?? "")}
                renderInPortal
                showAllOption={false}
              />
            </label>
            <div
              className={`cash-payments-shift-banner${
                !loadingShift && !activeShiftDetail
                  ? " cash-payments-shift-banner--warning"
                  : ""
              }`}
            >
              {loadingShift ? (
                <span className="cash-payments-shift-chip cash-payments-shift-chip--muted">
                  Revisando turno...
                </span>
              ) : activeShiftDetail ? (
                <>
                  <span className="cash-payments-shift-chip">Turno abierto</span>
                  <small>
                    Fondo {formatMoney(activeShiftDetail.summary.openingAmount)} · Disponible{" "}
                    {formatMoney(activeShiftDetail.summary.expectedAmount)}
                  </small>
                </>
              ) : (
                <>
                  <span className="cash-payments-shift-banner__icon" aria-hidden="true">
                    <FaExclamationTriangle />
                  </span>
                  <span className="cash-payments-shift-banner__copy">
                    <strong>Sin turno abierto</strong>
                    <small>Abre la caja POS antes de empezar a cobrar.</small>
                  </span>
                  <Link to="/caja/turno" className="cash-payments-shift-banner__action">
                    Abrir turno <FaArrowRight />
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="cash-payments-workarea">
          {currentStepIndex === 0 ? (
            <>
            <p className="cash-payments-panel__caption">
              Escanea o pega el QR del boleto para empezar.
              {selectedCashier
                ? activeShiftDetail
                  ? ` Se abrira el cobro automaticamente en ${selectedCashier.identificador} - ${selectedCashier.nombre}.`
                  : ` Primero abre el turno en ${selectedCashier.identificador} - ${selectedCashier.nombre} para cobrar ahi.`
                : " Si todavia no eliges caja, el sistema te la pedira en el siguiente paso."}
            </p>
            <label>
              QR o idBoleto
              <input
                ref={qrInputRef}
                autoFocus
                value={qrValue}
                onChange={(event) => onHandleQrInputChange(event.target.value)}
                onKeyDown={onHandleQrInputKeyDown}
                placeholder="Escanea o pega el boleto"
              />
            </label>
            {scannerMeta.isScannerLikely ? (
              <p className="cash-payments-panel__caption">
                ID detectado. Validando boleto al terminar la captura...
              </p>
            ) : null}
            <div className="cash-payments-actions">
              <button
                type="button"
                className="cash-payments-button cash-payments-button--primary cash-payments-button--validate"
                onClick={onResolveQr}
                disabled={loading}
              >
                <FaQrcode />{" "}
                {selectedCashierId && activeShiftDetail
                  ? "Validar y abrir cobro"
                  : "Validar boleto"}
              </button>
            </div>
            </>
          ) : null}

          {currentStepIndex === 0 && resolvedTicket && !session ? (
            <>
              <p className="cash-payments-panel__caption">
                Boleto <strong>{resolvedTicket.idBoleto}</strong> por{" "}
                <strong>{formatMoney(resolvedTicket.monto)}</strong>. Confirma la caja
                donde se va a cobrar.
              </p>
              <div className="cash-payments-actions">
                <button
                  type="button"
                  className="cash-payments-button cash-payments-button--primary"
                  onClick={onStartSession}
                  disabled={loading || !selectedCashierId || !activeShiftDetail}
                >
                  <FaCashRegister /> Iniciar cobro
                </button>
                <button
                  type="button"
                  className="cash-payments-button cash-payments-button--secondary"
                  onClick={onResetFlow}
                  disabled={loading}
                >
                  <FaUndo /> Escanear otro boleto
                </button>
              </div>
            </>
          ) : null}

          {currentStepIndex === 1 ? (
            <>
              {isSessionClosed ? (
                <div className="cash-payments-alert cash-payments-alert--error">
                  Este cobro quedo pendiente de revision. Puedes iniciar un nuevo cobro
                  en la misma caja.
                </div>
              ) : (
                <p className="cash-payments-panel__caption">
                  Faltan <strong>{formatMoney(pendingAmount)}</strong> por cobrar.
                  Registra el efectivo conforme lo vayas recibiendo.
                </p>
              )}

              {!isSessionClosed ? (
                <>
                  <div className="cash-payments-form__row">
                    <label>
                      Efectivo recibido
                      <input
                        ref={amountInputRef}
                        autoFocus
                        value={insertAmount}
                        onChange={(event) => onSetInsertAmount(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void onInsertCash();
                        }}
                        placeholder="0"
                      />
                    </label>
                    <label>
                      Cambio proyectado
                      <input value={formatMoney(projectedChange)} readOnly />
                    </label>
                  </div>
                  <div className="cash-payments-actions">
                    <button
                      type="button"
                      className="cash-payments-button cash-payments-button--primary"
                      onClick={onInsertCash}
                      disabled={loading}
                    >
                      <FaMoneyBillWave /> Confirmar efectivo
                    </button>
                    <button
                      type="button"
                      className="cash-payments-button cash-payments-button--danger"
                      onClick={onCancelCash}
                      disabled={loading}
                    >
                      Cancelar cobro
                    </button>
                  </div>
                </>
              ) : (
                <div className="cash-payments-actions">
                  <button
                    type="button"
                    className="cash-payments-button cash-payments-button--primary"
                    onClick={onStartSession}
                    disabled={loading}
                  >
                    <FaCashRegister /> Iniciar de nuevo
                  </button>
                  <button
                    type="button"
                    className="cash-payments-button cash-payments-button--secondary"
                    onClick={onBackToCashierStep}
                    disabled={loading}
                  >
                    Cambiar de caja
                  </button>
                  <button
                    type="button"
                    className="cash-payments-button cash-payments-button--secondary"
                    onClick={onResetFlow}
                    disabled={loading}
                  >
                    <FaUndo /> Escanear otro boleto
                  </button>
                </div>
              )}
            </>
          ) : null}

          {currentStepIndex === 2 ? (
            <>
              <div className="cash-payments-done">
                <FaCheckCircle className="cash-payments-done__icon" />
                <p>
                  El boleto <strong>{resolvedTicket?.idBoleto}</strong> quedo marcado
                  como pagado.
                  {session && session.changeAmount > 0
                    ? ` Entrega ${formatMoney(session.changeAmount)} de cambio.`
                    : " No hay cambio por entregar."}
                </p>
              </div>
              <div className="cash-payments-actions">
                <button
                  type="button"
                  className="cash-payments-button cash-payments-button--primary"
                  onClick={onResetFlow}
                >
                  <FaQrcode /> Nuevo cobro
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
