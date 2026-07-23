import { BaseModalWrapper } from "./BaseModalWrapper";

type RequiredRangeParkingOption = {
  id: string;
  name: string;
};

type RequiredRangeModalProps = {
  open: boolean;
  title: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
  errorMessage?: string | null;
  parkingOptions?: RequiredRangeParkingOption[];
  parkingId?: string;
  onParkingChange?: (value: string) => void;
  parkingRequired?: boolean;
  timeFrom?: string;
  timeTo?: string;
  onTimeFromChange?: (value: string) => void;
  onTimeToChange?: (value: string) => void;
};

export function RequiredRangeModal({
  open,
  title,
  description,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClose,
  errorMessage,
  parkingOptions = [],
  parkingId = "all",
  onParkingChange,
  parkingRequired = false,
  timeFrom,
  timeTo,
  onTimeFromChange,
  onTimeToChange,
}: RequiredRangeModalProps) {
  const showTimeFields = Boolean(onTimeFromChange || onTimeToChange);

  return (
    <BaseModalWrapper open={open} onClose={onClose} className="required-range-modal">
      <h2 className="modal-form-title">{title}</h2>

      {errorMessage ? <p className="modal-form-error">{errorMessage}</p> : null}

      <section className="modal-form-section">
        <p className="modal-form-description">{description}</p>

        <div className="modal-section-grid">
          {parkingRequired ? (
            <div className="form-group modal-field-full">
              <label htmlFor="required-range-parking">
                Proyecto <span className="required">*</span>
              </label>
              <select
                id="required-range-parking"
                value={parkingId}
                onChange={(event) => onParkingChange?.(event.target.value)}
                aria-invalid={parkingId === "all"}
              >
                <option value="all">Selecciona un proyecto</option>
                {parkingOptions.map((parking) => (
                  <option key={parking.id} value={parking.id}>
                    {parking.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="required-range-date-from">
              Fecha desde <span className="required">*</span>
            </label>
            <input
              id="required-range-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              aria-invalid={!dateFrom}
            />
          </div>

          <div className="form-group">
            <label htmlFor="required-range-date-to">
              Fecha hasta <span className="required">*</span>
            </label>
            <input
              id="required-range-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              aria-invalid={!dateTo}
            />
          </div>

          {showTimeFields ? (
            <>
              <div className="form-group">
                <label htmlFor="required-range-time-from">Hora desde</label>
                <input
                  id="required-range-time-from"
                  type="time"
                  value={timeFrom ?? ""}
                  onChange={(event) => onTimeFromChange?.(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="required-range-time-to">Hora hasta</label>
                <input
                  id="required-range-time-to"
                  type="time"
                  value={timeTo ?? ""}
                  onChange={(event) => onTimeToChange?.(event.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <div className="modal-form-actions">
        <button type="button" className="btn-form-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn-form-primary" onClick={onApply}>
          Aplicar intervalo
        </button>
      </div>
    </BaseModalWrapper>
  );
}
