import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CashRegisterCutPreview,
  CashRegisterDenominationLine,
  CashRegisterShiftDetail,
  CashSession,
  CashierOption,
  NamedOption,
  TicketView,
} from "../../types/cashPayments/cash-payments.types";
import {
  CASHIER_STORAGE_KEY,
  CLOSED_SESSION_STATUSES,
  createDefaultDenominationLines,
  getCashPaymentFlowStorageKey,
  getErrorMessage,
} from "../../utils/cashPayments/cash-payments.formatters";
import {
  getActiveCashRegisterShift,
} from "../../services/cashPayments/cash-payments.api";
import {
  getInitialCashierId,
  loadCashPaymentsCatalog,
} from "../../services/cashPayments/cash-payments.catalog";
import {
  cancelCashSessionFlow,
  closeCashShiftFlow,
  insertCashFlow,
  openCashShiftFlow,
  previewCashCutFlow,
  registerCashMovementFlow,
  resetCashCountState,
  resolveQrFlow,
  startCashSessionFlow,
} from "../../services/cashPayments/cash-payments.flow";
import {
  createEmptyScannerMeta,
  createEmptyScannerTypingState,
  getCompletedInputSource,
  getScannerMetaAfterCharacter,
  SCANNER_IDLE_RESOLVE_MS,
} from "../../utils/cashPayments/cash-payments.scanner";
import {
  clearPersistedCashPaymentState,
  persistCashPaymentState,
  readPersistedCashPaymentState,
} from "../../utils/cashPayments/cash-payments.storage";

// Cambia a true para volver a enfocar automaticamente el input del QR.
const ENABLE_QR_AUTO_FOCUS = false;

export const useCashPaymentsFlow = () => {
  const cashPaymentFlowStorageKey = useMemo(() => getCashPaymentFlowStorageKey(), []);
  const qrInputRef = useRef<HTMLInputElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const scannerResolveTimeoutRef = useRef<number | null>(null);
  const scannerMetaRef = useRef(createEmptyScannerTypingState());

  const [qrValue, setQrValue] = useState("");
  const [cashiers, setCashiers] = useState<CashierOption[]>([]);
  const [projects, setProjects] = useState<NamedOption[]>([]);
  const [selectedCashierId, setSelectedCashierIdState] = useState("");
  const [insertAmount, setInsertAmount] = useState("");
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [resolvedTicket, setResolvedTicket] = useState<TicketView | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  const [activeShiftDetail, setActiveShiftDetail] =
    useState<CashRegisterShiftDetail | null>(null);
  const [cutPreview, setCutPreview] = useState<CashRegisterCutPreview | null>(null);
  const [movementAmount, setMovementAmount] = useState("");
  const [movementConcept, setMovementConcept] = useState("");
  const [movementType, setMovementType] = useState<"manual_income" | "manual_expense">(
    "manual_income",
  );
  const [countNotes, setCountNotes] = useState("");
  const [denominationLines, setDenominationLines] = useState<CashRegisterDenominationLine[]>(
    () => createDefaultDenominationLines(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingCashiers, setLoadingCashiers] = useState(true);
  const [loadingShift, setLoadingShift] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [scannerMeta, setScannerMeta] = useState(createEmptyScannerMeta);

  const availableCashiers = useMemo(() => {
    if (!resolvedTicket?.proyecto) return cashiers;
    const scopedCashiers = cashiers.filter(
      (cashier) => cashier.proyecto === resolvedTicket.proyecto,
    );
    return scopedCashiers.length > 0 ? scopedCashiers : cashiers;
  }, [cashiers, resolvedTicket]);

  const selectedCashier = useMemo(
    () =>
      availableCashiers.find((cashier) => cashier.id === selectedCashierId) ??
      cashiers.find((cashier) => cashier.id === selectedCashierId) ??
      null,
    [availableCashiers, cashiers, selectedCashierId],
  );

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.nombre])),
    [projects],
  );

  const pendingAmount = useMemo(() => {
    if (!session) return resolvedTicket ? resolvedTicket.monto : 0;
    return Math.max(session.amountExpected - session.amountReceived, 0);
  }, [resolvedTicket, session]);

  const projectedChange = useMemo(() => {
    const amount = Number(insertAmount);
    if (!session || !Number.isFinite(amount) || amount <= 0) {
      return session?.changeAmount ?? 0;
    }

    return Math.max(amount - pendingAmount, 0);
  }, [insertAmount, pendingAmount, session]);

  const isTicketPaid = useMemo(
    () => Boolean(resolvedTicket?.pagado) || session?.status === "paid",
    [resolvedTicket, session],
  );

  const isSessionClosed = useMemo(
    () => Boolean(session && CLOSED_SESSION_STATUSES.includes(session.status)),
    [session],
  );

  const currentStepIndex = useMemo(() => {
    if (isTicketPaid) return 2;
    if (session) return 1;
    return 0;
  }, [isTicketPaid, session]);

  const isShiftRequiredForCheckout = useMemo(
    () =>
      currentStepIndex === 0 &&
      Boolean(selectedCashierId) &&
      !loadingShift &&
      !activeShiftDetail,
    [activeShiftDetail, currentStepIndex, loadingShift, selectedCashierId],
  );

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const setSelectedCashierId = (cashierId: string) => {
    setSelectedCashierIdState(cashierId);
    setCutPreview(null);
    clearMessages();
  };

  const focusQrInput = () => {
    if (!ENABLE_QR_AUTO_FOCUS) return;

    window.setTimeout(() => {
      qrInputRef.current?.focus();
      qrInputRef.current?.select();
    }, 0);
  };

  const focusAmountInput = () => {
    window.setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }, 0);
  };

  const clearScannerTimeout = () => {
    if (scannerResolveTimeoutRef.current !== null) {
      window.clearTimeout(scannerResolveTimeoutRef.current);
      scannerResolveTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const persistedState = readPersistedCashPaymentState(cashPaymentFlowStorageKey);
    if (!persistedState) return;

    setQrValue(persistedState.qrValue);
    setSelectedCashierIdState(persistedState.selectedCashierId);
    setInsertAmount(persistedState.insertAmount);
    setOpeningAmount(persistedState.openingAmount);
    setOpeningNotes(persistedState.openingNotes);
    setResolvedTicket(persistedState.resolvedTicket);
    setSession(persistedState.session);
  }, [cashPaymentFlowStorageKey]);

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!selectedCashierId) return;
    window.localStorage.setItem(CASHIER_STORAGE_KEY, selectedCashierId);
  }, [selectedCashierId]);

  useEffect(() => {
    persistCashPaymentState({
      storageKey: cashPaymentFlowStorageKey,
      qrValue,
      selectedCashierId,
      insertAmount,
      openingAmount,
      openingNotes,
      resolvedTicket,
      session,
    });
  }, [
    cashPaymentFlowStorageKey,
    insertAmount,
    openingAmount,
    openingNotes,
    qrValue,
    resolvedTicket,
    selectedCashierId,
    session,
  ]);

  useEffect(() => {
    void (async () => {
      setLoadingCashiers(true);
      try {
        const { cashiers: nextCashiers, projects: nextProjects } =
          await loadCashPaymentsCatalog();

        setCashiers(nextCashiers);
        setProjects(nextProjects);
        setSelectedCashierIdState((current) =>
          getInitialCashierId(current, nextCashiers),
        );
      } catch {
        setCashiers([]);
        setProjects([]);
        setSelectedCashierIdState("");
      } finally {
        setLoadingCashiers(false);
      }
    })();
  }, []);

  const refreshActiveShift = async (cashierId: string) => {
    if (!cashierId.trim()) {
      setActiveShiftDetail(null);
      return;
    }

    setLoadingShift(true);
    try {
      setActiveShiftDetail(await getActiveCashRegisterShift(cashierId));
      setCutPreview(null);
    } catch {
      setActiveShiftDetail(null);
      setCutPreview(null);
    } finally {
      setLoadingShift(false);
    }
  };

  useEffect(() => {
    if (!ENABLE_QR_AUTO_FOCUS) {
      return;
    }

    if (isShiftRequiredForCheckout) {
      return;
    }

    if (currentStepIndex === 1 && session && !isSessionClosed) {
      focusAmountInput();
      return;
    }

    if (currentStepIndex === 0) {
      focusQrInput();
    }
  }, [currentStepIndex, isSessionClosed, isShiftRequiredForCheckout, session]);

  useEffect(() => {
    void refreshActiveShift(selectedCashierId);
  }, [selectedCashierId]);

  useEffect(() => {
    if (!ENABLE_QR_AUTO_FOCUS) {
      return;
    }

    if (currentStepIndex !== 0 || loading || isShiftRequiredForCheckout) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        focusQrInput();
        return;
      }

      if (
        qrInputRef.current &&
        (target === qrInputRef.current || qrInputRef.current.contains(target))
      ) {
        return;
      }

      const interactiveContainer = target.closest(
        "button, input, textarea, select, [role='combobox'], [role='option'], .vcombo, .vcombo-popover",
      );

      if (interactiveContainer) {
        return;
      }

      focusQrInput();
    };

    const handleWindowBlur = () => {
      focusQrInput();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [currentStepIndex, isShiftRequiredForCheckout, loading]);

  useEffect(() => {
    if (!isShiftRequiredForCheckout) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }, [isShiftRequiredForCheckout]);

  useEffect(() => {
    if (
      !scannerMeta.isScannerLikely ||
      loading ||
      currentStepIndex !== 0 ||
      !qrValue.trim()
    ) {
      clearScannerTimeout();
      return;
    }

    clearScannerTimeout();
    scannerResolveTimeoutRef.current = window.setTimeout(() => {
      void resolveQr("scanner");
    }, SCANNER_IDLE_RESOLVE_MS);

    return clearScannerTimeout;
  }, [currentStepIndex, loading, qrValue, scannerMeta.isScannerLikely]);

  const resolveQr = async (source: "scanner" | "manual" = "manual") => {
    if (!qrValue.trim()) {
      setError("Captura o escanea un QR de boleto.");
      setSuccessMessage(null);
      focusQrInput();
      return;
    }

    setLoading(true);
    clearMessages();
    clearScannerTimeout();

    try {
      const result = await resolveQrFlow({
        qrValue,
        selectedCashierId,
        activeShiftDetail,
      });

      setResolvedTicket(result.ticket);
      setSession(result.session);
      setSuccessMessage(result.successMessage);
      setScannerMeta({
        isScannerLikely: false,
        lastCompletedInput: source,
      });
    } catch (requestError) {
      setResolvedTicket(null);
      setSession(null);
      setScannerMeta({
        isScannerLikely: false,
        lastCompletedInput: source,
      });
      setError(getErrorMessage(requestError, "No se pudo validar el boleto."));
      focusQrInput();
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    setLoading(true);
    clearMessages();

    try {
      const nextSession = await startCashSessionFlow({
        ticket: resolvedTicket,
        selectedCashierId,
        activeShiftDetail,
      });
      setSession(nextSession);
      setSuccessMessage("Cobro iniciado.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo iniciar el cobro."));
    } finally {
      setLoading(false);
    }
  };

  const insertCash = async () => {
    setLoading(true);
    clearMessages();

    try {
      const nextSession = await insertCashFlow({
        session,
        insertAmount,
        selectedCashier,
      });
      setSession(nextSession);
      await refreshActiveShift(nextSession.moduloId || selectedCashierId);

      if (nextSession.status === "paid") {
        setResolvedTicket((current) =>
          current
            ? {
                ...current,
                pagado: true,
                horaCobro:
                  nextSession.completedAt && Number.isFinite(nextSession.completedAt)
                    ? nextSession.completedAt
                    : Date.now(),
              }
            : current,
        );
      }

      setSuccessMessage(
        nextSession.status === "paid"
          ? "Cobro completado y ticket marcado como pagado."
          : "Efectivo registrado en el cobro.",
      );

      if (nextSession.status !== "paid") {
        setInsertAmount("");
        focusAmountInput();
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo registrar el efectivo."));
      focusAmountInput();
    } finally {
      setLoading(false);
    }
  };

  const cancelSession = async () => {
    setLoading(true);
    clearMessages();

    try {
      let cancellationReason: string | undefined;
      if (session && session.amountReceived > 0) {
        cancellationReason =
          window.prompt(
            "Este cobro ya tiene efectivo registrado. Captura el motivo de cancelacion:",
          )?.trim() || undefined;

      }

      const nextSession = await cancelCashSessionFlow({
        session,
        cancellationReason,
      });
      setSession(nextSession);
      setSuccessMessage("Cobro cancelado.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cancelar el cobro."));
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setResolvedTicket(null);
    setSession(null);
    setQrValue("");
    setInsertAmount("");
    setScannerMeta({
      isScannerLikely: false,
      lastCompletedInput: null,
    });
    clearMessages();
    clearPersistedCashPaymentState(cashPaymentFlowStorageKey);
    focusQrInput();
  };

  const backToCashierStep = () => {
    setSession(null);
    clearMessages();
  };

  const openShift = async () => {
    setLoading(true);
    clearMessages();

    try {
      const shiftDetail = await openCashShiftFlow({
        selectedCashierId,
        openingAmount,
        openingNotes,
      });

      setActiveShiftDetail(shiftDetail);
      setOpeningAmount("");
      setOpeningNotes("");
      setCutPreview(null);
      setSuccessMessage("Caja abierta correctamente. Ya puedes cobrar boletos.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo abrir la caja."));
    } finally {
      setLoading(false);
    }
  };

  const registerManualMovement = async () => {
    setLoading(true);
    clearMessages();

    try {
      const detail = await registerCashMovementFlow({
        activeShiftDetail,
        movementType,
        movementConcept,
        movementAmount,
      });
      if (detail) {
        setActiveShiftDetail(detail);
      } else if (activeShiftDetail) {
        await refreshActiveShift(activeShiftDetail.shift.moduloId);
      }

      setMovementAmount("");
      setMovementConcept("");
      setCutPreview(null);
      setSuccessMessage("Movimiento registrado en la caja.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo registrar el movimiento."));
    } finally {
      setLoading(false);
    }
  };

  const updateDenominationQuantity = (index: number, value: string) => {
    setDenominationLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, quantity: value } : line,
      ),
    );
  };

  const previewCut = async () => {
    setLoading(true);
    clearMessages();

    try {
      const nextCutPreview = await previewCashCutFlow({
        activeShiftDetail,
        denominationLines,
        countNotes,
      });
      if (activeShiftDetail) {
        await refreshActiveShift(activeShiftDetail.shift.moduloId);
      }
      setCutPreview(nextCutPreview);
      setSuccessMessage("Conteo guardado y corte calculado.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo calcular el corte."));
    } finally {
      setLoading(false);
    }
  };

  const closeShift = async () => {
    setLoading(true);
    clearMessages();

    try {
      await closeCashShiftFlow({
        activeShiftDetail,
        denominationLines,
        countNotes,
      });

      setSuccessMessage("Turno cerrado correctamente.");
      if (activeShiftDetail) {
        await refreshActiveShift(activeShiftDetail.shift.moduloId);
      }
      const resetState = resetCashCountState();
      setCutPreview(resetState.cutPreview);
      setDenominationLines(resetState.denominationLines);
      setCountNotes(resetState.countNotes);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cerrar el turno."));
    } finally {
      setLoading(false);
    }
  };

  const handleQrInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();

    if (event.key === "Enter") {
      event.preventDefault();
      clearScannerTimeout();
      const inputSource = getCompletedInputSource(
        scannerMetaRef.current,
        qrValue,
        now,
      );

      setScannerMeta({
        isScannerLikely: false,
        lastCompletedInput: inputSource,
      });
      scannerMetaRef.current = createEmptyScannerTypingState();
      void resolveQr(inputSource);
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    const nextScannerState = getScannerMetaAfterCharacter(
      scannerMetaRef.current,
      now,
    );
    scannerMetaRef.current = nextScannerState.typingState;

    setScannerMeta((current) => ({
      ...current,
      isScannerLikely: nextScannerState.isScannerLikely,
    }));
  };

  const handleQrInputChange = (value: string) => {
    setQrValue(value);

    if (!value.trim()) {
      clearScannerTimeout();
      scannerMetaRef.current = createEmptyScannerTypingState();
      setScannerMeta((current) => ({
        ...current,
        isScannerLikely: false,
      }));
    }
  };

  return {
    availableCashiers,
    activeShiftDetail,
    backToCashierStep,
    closeShift,
    currentStepIndex,
    cutPreview,
    denominationLines,
    error,
    insertAmount,
    isSessionClosed,
    isShiftRequiredForCheckout,
    isTicketPaid,
    loading,
    loadingCashiers,
    loadingShift,
    amountInputRef,
    handleQrInputChange,
    handleQrInputKeyDown,
    movementAmount,
    movementConcept,
    movementType,
    openingAmount,
    openingNotes,
    openShift,
    pendingAmount,
    previewCut,
    projectedChange,
    projectNameById,
    qrInputRef,
    qrValue,
    resetFlow,
    resolveQr,
    resolvedTicket,
    scannerMeta,
    selectedCashier,
    selectedCashierId,
    session,
    setCountNotes,
    setMovementAmount,
    setMovementConcept,
    setMovementType,
    setOpeningAmount,
    setOpeningNotes,
    setInsertAmount,
    setSelectedCashierId,
    startSession,
    successMessage,
    cancelSession,
    insertCash,
    updateDenominationQuantity,
    registerManualMovement,
    countNotes,
  };
};
