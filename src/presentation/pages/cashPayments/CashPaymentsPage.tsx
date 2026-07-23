import { Link } from "react-router-dom";
import { BaseCombobox } from "../../components/shared/BaseCombobox/BaseCombobox";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { CashRegisterPanel } from "../../components/cashPayments/CashRegisterPanel";
import { CashPaymentsHeader } from "../../components/cashPayments/CashPaymentsHeader";
import { CashPaymentsSessionPanel } from "../../components/cashPayments/CashPaymentsSessionPanel";
import { CashPaymentsWorkbench } from "../../components/cashPayments/CashPaymentsWorkbench";
import "../../styles/cashPayments/CashPaymentsLayout.css";
import { useCashPaymentsFlow } from "../../hooks/cashPayments/useCashPaymentsFlow";

type CashPaymentsPageProps = {
  section?: "checkout" | "shift";
  pageTitle?: string;
};

export function CashPaymentsPage({
  section = "checkout",
  pageTitle = section === "shift" ? "Turno de Caja" : "Cobro en Caja",
}: CashPaymentsPageProps) {
  const flow = useCashPaymentsFlow();
  usePageTitle(pageTitle);
  const activeTab = section;
  const cashierOptions = flow.availableCashiers.map((cashier) => ({
    id: cashier.id,
    nombre: `${cashier.identificador} - ${cashier.nombre}`,
  }));

  return (
    <main className="cash-payments-page">
      {activeTab === "checkout" && flow.isShiftRequiredForCheckout ? (
        <div className="cash-payments-page-lock" role="alertdialog" aria-modal="true">
          <div className="cash-payments-page-lock__backdrop" />
          <div className="cash-payments-page-lock__card">
            <span className="cash-payments-page-lock__badge">Turno requerido</span>
            <h2>No puedes cobrar todavia</h2>
            <p>
              La caja seleccionada no tiene un turno abierto. Abre primero el turno en{" "}
              <strong>{flow.selectedCashier?.identificador ?? "la POS seleccionada"}</strong>{" "}
              y luego regresa aqui para cobrar.
            </p>
            <label className="cash-payments-page-lock__field">
              Cambiar caja
              <BaseCombobox
                placeholder="Buscar caja"
                allLabel={flow.loadingCashiers ? "Cargando cajas..." : "Selecciona una caja"}
                iconTitle="Seleccionar caja"
                options={cashierOptions}
                value={flow.selectedCashierId || undefined}
                onChange={(id) => flow.setSelectedCashierId(id ?? "")}
                showAllOption={false}
              />
            </label>
            <Link to="/caja/turno" className="cash-payments-page-lock__button">
              Ir a turno de caja
            </Link>
          </div>
        </div>
      ) : null}

      <CashPaymentsHeader
        activeShiftDetail={flow.activeShiftDetail}
        currentStepIndex={flow.currentStepIndex}
        isTicketPaid={flow.isTicketPaid}
        pendingAmount={flow.pendingAmount}
        projectNameById={flow.projectNameById}
        resolvedTicket={flow.resolvedTicket}
        section={activeTab}
        selectedCashier={flow.selectedCashier}
        session={flow.session}
      />

      {activeTab === "checkout" ? (
        <section
          className={`cash-payments-grid${flow.currentStepIndex <= 2 ? " cash-payments-grid--focus-session" : ""}`}
          aria-hidden={flow.isShiftRequiredForCheckout}
        >
          <CashPaymentsWorkbench
            activeShiftDetail={flow.activeShiftDetail}
            availableCashierOptions={cashierOptions}
            currentStepIndex={flow.currentStepIndex}
            error={flow.error}
            insertAmount={flow.insertAmount}
            isSessionClosed={flow.isSessionClosed}
            loading={flow.loading}
            loadingCashiers={flow.loadingCashiers}
            loadingShift={flow.loadingShift}
            amountInputRef={flow.amountInputRef}
            onHandleQrInputChange={flow.handleQrInputChange}
            onHandleQrInputKeyDown={flow.handleQrInputKeyDown}
            pendingAmount={flow.pendingAmount}
            projectedChange={flow.projectedChange}
            qrInputRef={flow.qrInputRef}
            qrValue={flow.qrValue}
            resolvedTicket={flow.resolvedTicket}
            scannerMeta={flow.scannerMeta}
            selectedCashier={flow.selectedCashier}
            selectedCashierId={flow.selectedCashierId}
            session={flow.session}
            successMessage={flow.successMessage}
            onBackToCashierStep={flow.backToCashierStep}
            onCancelCash={flow.cancelSession}
            onInsertCash={flow.insertCash}
            onResetFlow={flow.resetFlow}
            onResolveQr={flow.resolveQr}
            onSetInsertAmount={flow.setInsertAmount}
            onSetSelectedCashierId={flow.setSelectedCashierId}
            onStartSession={flow.startSession}
          />
          <CashPaymentsSessionPanel
            activeShiftDetail={flow.activeShiftDetail}
            session={flow.session}
          />
        </section>
      ) : (
        <CashRegisterPanel
          activeShiftDetail={flow.activeShiftDetail}
          availableCashierOptions={cashierOptions}
          countNotes={flow.countNotes}
          denominationLines={flow.denominationLines}
          error={flow.error}
          loading={flow.loading}
          loadingCashiers={flow.loadingCashiers}
          loadingShift={flow.loadingShift}
          movementAmount={flow.movementAmount}
          movementConcept={flow.movementConcept}
          movementType={flow.movementType}
          openingAmount={flow.openingAmount}
          openingNotes={flow.openingNotes}
          selectedCashier={flow.selectedCashier}
          selectedCashierId={flow.selectedCashierId}
          successMessage={flow.successMessage}
          onCloseShift={flow.closeShift}
          onOpenShift={flow.openShift}
          onRegisterManualMovement={flow.registerManualMovement}
          onSetCountNotes={flow.setCountNotes}
          onSetMovementAmount={flow.setMovementAmount}
          onSetMovementConcept={flow.setMovementConcept}
          onSetMovementType={flow.setMovementType}
          onSetOpeningAmount={flow.setOpeningAmount}
          onSetOpeningNotes={flow.setOpeningNotes}
          onSetSelectedCashierId={flow.setSelectedCashierId}
          onUpdateDenominationQuantity={flow.updateDenominationQuantity}
        />
      )}
    </main>
  );
}
