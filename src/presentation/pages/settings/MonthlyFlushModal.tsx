import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaCalendarAlt, FaChevronDown, FaClock } from "react-icons/fa";
import { BaseModalWrapper } from "../../components/shared/modals/BaseModalWrapper";
import { ScreenLoader } from "../../components/shared/loading/ScreenLoader";
import type { MonthlyFlushHistoryItem } from "../../services/monthlyFlush/monthlyFlush.api";

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  year: "numeric",
  month: "long",
  timeZone: "UTC",
});

type MonthlyFlushModalProps = {
  open: boolean;
  onClose: () => void;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  partialCurrentMonthEnabled: boolean;
  onPartialCurrentMonthEnabledChange: (value: boolean) => void;
  closeDay: number;
  partialDays: number[];
  onToggleDay: (day: number) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
  onUpdateDay: (previousDay: number, nextValue: string) => void;
  hour: string;
  minute: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
  updatedAt: number | null;
  updatedBy: string | null;
  history: MonthlyFlushHistoryItem[];
  manualMonth: string;
  manualMonthMax: string;
  manualRunDisabled?: boolean;
  manualRunHint?: string | null;
  onManualMonthChange: (value: string) => void;
  isRunningManual: boolean;
  onRunManual: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
};

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
};

export function MonthlyFlushModal({
  open,
  onClose,
  error,
  isLoading,
  isSaving,
  enabled,
  onEnabledChange,
  partialCurrentMonthEnabled,
  onPartialCurrentMonthEnabledChange,
  closeDay,
  partialDays,
  onToggleDay,
  onAddDay,
  onRemoveDay,
  onUpdateDay,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  updatedAt,
  updatedBy,
  history,
  manualMonth,
  manualMonthMax,
  manualRunDisabled = false,
  manualRunHint = null,
  onManualMonthChange,
  isRunningManual,
  onRunManual,
  onSave,
}: MonthlyFlushModalProps) {
  const [isDaysPickerOpen, setIsDaysPickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const historyByYear = useMemo(() => {
    const groups = new Map<string, MonthlyFlushHistoryItem[]>();
    history.forEach((item) => {
      const year = item.monthKey.split("-")[0] ?? "Sin ano";
      const current = groups.get(year) ?? [];
      current.push(item);
      groups.set(year, current);
    });

    return Array.from(groups.entries()).map(([year, items]) => ({
      year,
      items: items.sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
    }));
  }, [history]);

  const manualLoader =
    isRunningManual && typeof document !== "undefined"
      ? createPortal(
          <div className="settings-monthly-flush-modal__loading-overlay" aria-hidden="true">
            <ScreenLoader label="flush mensual" registerPageLoading={false} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {manualLoader}
      <BaseModalWrapper
        open={open}
        onClose={onClose}
        isSubmitting={isSaving || isRunningManual}
        className="settings-monthly-flush-modal"
        showCloseButton
      >
        <div className="settings-monthly-flush-modal__content">
          <h2 className="modal-form-title">Flush mensual</h2>

          {error ? (
            <div className="modal-form-error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="modal-form-sections">
            <section className="modal-form-section">
              <div className="settings-monthly-flush-modal__hero">
                <div className="settings-monthly-flush-modal__hero-copy">
                  <p className="settings-monthly-flush-modal__eyebrow">Bitacora local</p>
                  <h3>{enabled ? "Flush automatico activo" : "Flush automatico pausado"}</h3>
                  <p>
                    El dia <strong>{closeDay}</strong> se consolida el mes anterior a las{" "}
                    <strong>
                      {hour.padStart(2, "0")}:{minute.padStart(2, "0")}
                    </strong>
                    .
                  </p>
                  {partialCurrentMonthEnabled ? (
                    <p>
                      Los parciales del mes actual corren en{" "}
                      <strong>{partialDays.length ? partialDays.join(", ") : "sin dias"}</strong>.
                    </p>
                  ) : null}
                </div>

                <div className="settings-monthly-flush-modal__hero-meta">
                  <span className="settings-monthly-flush-modal__badge">
                    Ultima actualizacion:{" "}
                    {updatedAt ? dateTimeFormatter.format(updatedAt) : "Sin registro"}
                  </span>
                  {updatedBy ? (
                    <span className="settings-monthly-flush-modal__badge">
                      Actualizado por: {updatedBy}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="settings-monthly-flush-modal__grid">
                <label className="settings-monthly-flush-modal__field settings-monthly-flush-modal__field--checkbox">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => onEnabledChange(event.target.checked)}
                    disabled={isLoading || isSaving}
                  />
                  <span className="settings-monthly-flush-modal__toggle-card">
                    <span className="settings-monthly-flush-modal__toggle-copy">
                      <strong>Habilitar ejecucion automatica</strong>
                      <small>
                        Cuando esta activo, el cierre mensual corre solo en segundo plano.
                      </small>
                    </span>
                    <span
                      className={`settings-monthly-flush-modal__toggle-switch ${enabled ? "is-enabled" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="settings-monthly-flush-modal__toggle-thumb" />
                    </span>
                  </span>
                </label>

                <label className="settings-monthly-flush-modal__field settings-monthly-flush-modal__field--checkbox">
                  <input
                    type="checkbox"
                    checked={partialCurrentMonthEnabled}
                    onChange={(event) =>
                      onPartialCurrentMonthEnabledChange(event.target.checked)
                    }
                    disabled={isLoading || isSaving}
                  />
                  <span className="settings-monthly-flush-modal__toggle-card">
                    <span className="settings-monthly-flush-modal__toggle-copy">
                      <strong>Habilitar parciales del mes actual</strong>
                      <small>
                        Si lo activas, puedes consolidar automaticamente hasta ayer en dias elegidos.
                      </small>
                    </span>
                    <span
                      className={`settings-monthly-flush-modal__toggle-switch ${
                        partialCurrentMonthEnabled ? "is-enabled" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <span className="settings-monthly-flush-modal__toggle-thumb" />
                    </span>
                  </span>
                </label>

                {partialCurrentMonthEnabled ? (
                  <div className="settings-monthly-flush-modal__field">
                    <span>Dias para parciales</span>
                    <div className="settings-monthly-flush-modal__picker">
                      <button
                        type="button"
                        className={`settings-monthly-flush-modal__picker-trigger ${
                          isDaysPickerOpen ? "is-open" : ""
                        }`}
                        onClick={() => setIsDaysPickerOpen((current) => !current)}
                        disabled={isLoading || isSaving}
                      >
                        <span className="settings-monthly-flush-modal__picker-trigger-main">
                          <FaCalendarAlt />
                          <strong>
                            {partialDays.length > 0 ? partialDays.join(", ") : "Sin dias"}
                          </strong>
                        </span>
                        <span className="settings-monthly-flush-modal__picker-trigger-meta">
                          {partialDays.length} seleccionados
                        </span>
                        <FaChevronDown className="settings-monthly-flush-modal__picker-chevron" />
                      </button>

                      {isDaysPickerOpen ? (
                        <div className="settings-monthly-flush-modal__picker-panel">
                          <div className="settings-monthly-flush-modal__days-toolbar">
                            <button
                              type="button"
                              className="settings-monthly-flush-modal__add-day"
                              onClick={onAddDay}
                              disabled={isLoading || isSaving || partialDays.length >= 30}
                            >
                              + Agregar dia
                            </button>
                          </div>

                          <div className="settings-monthly-flush-modal__day-chips">
                            {partialDays.map((day) => (
                              <div key={day} className="settings-monthly-flush-modal__day-chip">
                                <input
                                  type="number"
                                  min={2}
                                  max={31}
                                  value={day}
                                  onChange={(event) => onUpdateDay(day, event.target.value)}
                                  disabled={isLoading || isSaving}
                                />
                                <button
                                  type="button"
                                  onClick={() => onRemoveDay(day)}
                                  disabled={isLoading || isSaving}
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="settings-monthly-flush-modal__calendar">
                            {Array.from({ length: 30 }, (_, index) => index + 2).map((day) => (
                              <button
                                key={day}
                                type="button"
                                className={`settings-monthly-flush-modal__calendar-day ${
                                  partialDays.includes(day) ? "is-selected" : ""
                                }`}
                                onClick={() => onToggleDay(day)}
                                disabled={isLoading || isSaving}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="settings-monthly-flush-modal__field">
                  <span>Horario</span>
                  <div className="settings-monthly-flush-modal__picker">
                    <button
                      type="button"
                      className={`settings-monthly-flush-modal__picker-trigger ${
                        isTimePickerOpen ? "is-open" : ""
                      }`}
                      onClick={() => setIsTimePickerOpen((current) => !current)}
                      disabled={isLoading || isSaving}
                    >
                      <span className="settings-monthly-flush-modal__picker-trigger-main">
                        <FaClock />
                        <strong>
                          {hour.padStart(2, "0")}:{minute.padStart(2, "0")}
                        </strong>
                      </span>
                      <span className="settings-monthly-flush-modal__picker-trigger-meta">
                        Hora local
                      </span>
                      <FaChevronDown className="settings-monthly-flush-modal__picker-chevron" />
                    </button>

                    {isTimePickerOpen ? (
                      <div className="settings-monthly-flush-modal__picker-panel settings-monthly-flush-modal__picker-panel--time">
                        <label className="settings-monthly-flush-modal__subfield">
                          <span>Hora</span>
                          <select
                            value={hour}
                            onChange={(event) => onHourChange(event.target.value)}
                            disabled={isLoading || isSaving}
                          >
                            {Array.from({ length: 24 }, (_, index) => index).map((value) => (
                              <option key={value} value={String(value).padStart(2, "0")}>
                                {String(value).padStart(2, "0")}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="settings-monthly-flush-modal__subfield">
                          <span>Minuto</span>
                          <select
                            value={minute}
                            onChange={(event) => onMinuteChange(event.target.value)}
                            disabled={isLoading || isSaving}
                          >
                            {Array.from({ length: 60 }, (_, index) => index).map((value) => (
                              <option key={value} value={String(value).padStart(2, "0")}>
                                {String(value).padStart(2, "0")}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="settings-monthly-flush-modal__field">
                  <span>Flush manual</span>
                  <div className="settings-monthly-flush-modal__manual-card">
                    <div className="settings-monthly-flush-modal__manual-copy">
                      <strong>Consolidar un mes especifico</strong>
                      <small>Usalo si quieres correr el consolidado sin esperar al automatico.</small>
                    </div>
                    <div className="settings-monthly-flush-modal__manual-controls">
                      <input
                        type="month"
                        value={manualMonth}
                        max={manualMonthMax}
                        onChange={(event) => onManualMonthChange(event.target.value)}
                        disabled={isLoading || isRunningManual}
                      />
                      <button
                        type="button"
                        className="settings-monthly-flush-modal__manual-run"
                        onClick={onRunManual}
                        disabled={manualRunDisabled || isLoading || isRunningManual}
                      >
                        {isRunningManual ? "Ejecutando..." : "Ejecutar"}
                      </button>
                    </div>
                    {manualRunHint ? (
                      <small className="settings-monthly-flush-modal__manual-hint">
                        {manualRunHint}
                      </small>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="modal-form-section">
              <h3 className="modal-section-title">Historial</h3>
              {historyByYear.length === 0 ? (
                <p className="settings-monthly-flush-modal__empty">Sin ejecuciones registradas.</p>
              ) : (
                <div className="settings-monthly-flush-modal__history">
                  {historyByYear.map((group) => (
                    <details key={group.year} className="settings-monthly-flush-modal__history-year">
                      <summary className="settings-monthly-flush-modal__history-year-summary">
                        <p>{group.year}</p>
                        <FaChevronDown className="settings-monthly-flush-modal__history-chevron" />
                      </summary>

                      <div className="settings-monthly-flush-modal__history-year-body">
                        {group.items.map((item) => (
                          <details
                            key={`${item.monthKey}-${item.startedAt}`}
                            className="settings-monthly-flush-modal__history-month"
                          >
                            <summary className="settings-monthly-flush-modal__history-month-summary">
                              <div>
                                <p>{getMonthLabel(item.monthKey)}</p>
                                <p className="settings-monthly-flush-modal__history-subtitle">
                                  {dateTimeFormatter.format(item.startedAt)}
                                </p>
                              </div>
                              <div className="settings-monthly-flush-modal__history-summary-meta">
                                <span
                                  className={`settings-monthly-flush-modal__job-status settings-monthly-flush-modal__job-status--${item.status}`}
                                >
                                  {item.status === "completed"
                                    ? "Completado"
                                    : item.status === "failed"
                                      ? "Fallido"
                                      : "En curso"}
                                </span>
                                <FaChevronDown className="settings-monthly-flush-modal__history-chevron" />
                              </div>
                            </summary>

                            <article className="settings-monthly-flush-modal__history-card">
                              <div className="settings-monthly-flush-modal__history-metrics">
                                <div className="settings-monthly-flush-modal__metric">
                                  <span>Dias</span>
                                  <strong>{item.summary?.daysProcessed ?? 0}</strong>
                                </div>
                                <div className="settings-monthly-flush-modal__metric">
                                  <span>Origen</span>
                                  <strong>{item.summary?.totalSourceRecordsAffected ?? 0}</strong>
                                </div>
                                <div className="settings-monthly-flush-modal__metric">
                                  <span>Resumenes</span>
                                  <strong>{item.summary?.flushedDocuments ?? 0}</strong>
                                </div>
                                <div className="settings-monthly-flush-modal__metric">
                                  <span>Eliminados</span>
                                  <strong>{item.summary?.deletedLogs ?? 0}</strong>
                                </div>
                              </div>

                              {item.error ? (
                                <p className="settings-monthly-flush-modal__job-error">
                                  {item.error}
                                </p>
                              ) : null}
                            </article>
                          </details>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="modal-form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cerrar
            </button>
            <button
              type="button"
              className="submit-button"
              onClick={onSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar configuracion"}
            </button>
          </div>
        </div>
      </BaseModalWrapper>
    </>
  );
}
