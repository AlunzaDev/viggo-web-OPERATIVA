import { InfoChip, PageHeader } from "@alunzadev/viggo-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCalculator, FaHistory, FaSave, FaTags } from "react-icons/fa";
import Swal from "sweetalert2";
import { hasModuleAccess } from "../../../domain/entities/module-access";
import { useAuth } from "../../context/auth/useAuth";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import {
  getParkingRate,
  getParkingRateHistory,
  saveParkingRate,
  simulateParkingFee,
  type ParkingFeeSimulation,
  type ParkingRate,
  type ParkingRateState,
} from "../../services/parkingRate/parking-rate.api";
import {
  DEFAULT_RATE_FORM,
  formatMoney,
  formToRules,
  rulesToForm,
  toMinutes,
  type ParkingRateForm,
} from "../../services/parkingRate/parking-rate.form";
import "../../styles/parkingRate/ParkingRatePage.css";

const FIELDS: Array<{ key: keyof ParkingRateForm; label: string; hint: string; unit: "min" | "$" }> = [
  { key: "toleranceMinutes", label: "Tolerancia", hint: "Minutos gratis al entrar.", unit: "min" },
  { key: "firstBlockMinutes", label: "Primer bloque", hint: "Duración del primer cobro, por ejemplo la primera hora.", unit: "min" },
  { key: "firstBlockPrice", label: "Precio del primer bloque", hint: "Se cobra en cuanto pasa la tolerancia.", unit: "$" },
  { key: "fractionMinutes", label: "Fracción", hint: "Después del primer bloque se cobra por fracción.", unit: "min" },
  { key: "fractionPrice", label: "Precio por fracción", hint: "Una fracción empezada se cobra completa.", unit: "$" },
  { key: "dailyMax", label: "Tope por día", hint: "Máximo por cada 24 h. Vacío: sin tope.", unit: "$" },
];

const formatDate = (value: number) => new Date(value).toLocaleString("es-MX");
const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** Rate of this parking: charged offline by this server, and copied to the cloud for reference. */
export function ParkingRatePage() {
  usePageTitle("Tarifa");
  const { user } = useAuth();
  // Changing the rate belongs with tickets, as on the server.
  const canEdit = user?.role === "superRole" || hasModuleAccess(user?.modules, "tickets");
  const [current, setCurrent] = useState<ParkingRateState | null>(null);
  const [history, setHistory] = useState<Array<ParkingRate & { descripcion: string }>>([]);
  const [form, setForm] = useState<ParkingRateForm>(DEFAULT_RATE_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stay, setStay] = useState({ hours: "1", minutes: "20" });
  const [simulation, setSimulation] = useState<ParkingFeeSimulation | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const state = await getParkingRate();
      setCurrent(state);
      if (state.tarifa) setForm(rulesToForm(state.tarifa));
      if (canEdit) setHistory(await getParkingRateHistory());
    } catch (loadError) {
      setError(errorMessage(loadError, "No se pudo cargar la tarifa"));
    } finally {
      setLoading(false);
    }
  }, [canEdit]);
  useEffect(() => { void load(); }, [load]);

  const draft = useMemo(() => formToRules(form), [form]);
  const savedForm = current?.tarifa ? rulesToForm(current.tarifa) : null;
  const dirty = canEdit && (!savedForm || (Object.keys(form) as Array<keyof ParkingRateForm>).some((key) => form[key].trim() !== savedForm[key]));
  const minutes = toMinutes(stay.hours, stay.minutes);

  // The calculator follows the draft while it is edited (or the current rate for read-only users).
  useEffect(() => {
    if (minutes === null) { setSimulation(null); setSimulationError("Escribe horas y minutos enteros"); return; }
    if (canEdit && "error" in draft) { setSimulation(null); setSimulationError(draft.error); return; }
    let active = true;
    const timer = setTimeout(() => {
      simulateParkingFee(minutes, canEdit && "rules" in draft ? draft.rules : undefined)
        .then((result) => { if (active) { setSimulation(result); setSimulationError(null); } })
        .catch((simulateError: unknown) => { if (active) setSimulationError(errorMessage(simulateError, "No se pudo calcular")); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [canEdit, draft, minutes]);

  const save = async () => {
    if (!("rules" in draft)) { setError(draft.error); return; }
    const confirmation = await Swal.fire({
      title: "¿Guardar la nueva tarifa?",
      text: "Se aplica a los tickets que se coticen desde ahora. Un cobro que ya está en curso conserva su monto.",
      icon: "question", showCancelButton: true, confirmButtonText: "Guardar", cancelButtonText: "Cancelar",
      background: "transparent", customClass: { popup: "swal-custom-popup", title: "swal-custom-title", htmlContainer: "swal-custom-text" },
    });
    if (!confirmation.isConfirmed) return;
    setSaving(true); setError(null);
    try {
      const state = await saveParkingRate(draft.rules);
      setCurrent(state);
      setForm(rulesToForm(state.tarifa!));
      setHistory(await getParkingRateHistory());
    } catch (saveError) {
      setError(errorMessage(saveError, "No se pudo guardar la tarifa"));
    } finally {
      setSaving(false);
    }
  };

  return <div className="parking-rate-page">
    <PageHeader title="Tarifa" hideTitle error={error}
      meta={current ? (current.configurada ? <InfoChip tone="success">Versión {current.tarifa?.version}</InfoChip> : <InfoChip tone="warning">Tarifa base</InfoChip>) : null} />

    <div className="parking-rate-page__grid">
      <section className="page-card parking-rate-card">
        <div className="modal-section-header"><FaTags className="modal-section-icon" /><h3 className="modal-section-title">Tarifa del estacionamiento</h3></div>
        {loading ? <p className="parking-rate-muted">Cargando…</p> : <>
          <p className="parking-rate-summary">{current?.descripcion}</p>
          {current?.configurada
            ? <p className="parking-rate-muted">Guardada el {formatDate(current.tarifa!.createdAt)}.</p>
            : <p className="parking-rate-muted">Todavía no hay una tarifa configurada: se cobra la tarifa base. {canEdit ? "Guarda una para reemplazarla." : ""}</p>}

          {canEdit ? <form className="parking-rate-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <div className="modal-section-grid">
              {FIELDS.map((field) => <div key={field.key} className="form-group">
                <label htmlFor={`rate-${field.key}`}>{field.label}</label>
                <div className={`parking-rate-input parking-rate-input--${field.unit === "$" ? "money" : "minutes"}`}>
                  {field.unit === "$" ? <span>$</span> : null}
                  <input id={`rate-${field.key}`} inputMode="decimal" value={form[field.key]} disabled={saving}
                    placeholder={field.key === "dailyMax" ? "Sin tope" : ""}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
                  {field.unit === "min" ? <span>min</span> : null}
                </div>
                <small>{field.hint}</small>
              </div>)}
            </div>
            {"error" in draft ? <p className="parking-rate-error">{draft.error}</p> : null}
            <div className="parking-rate-actions">
              {dirty && savedForm ? <button type="button" className="btn-form-secondary" disabled={saving} onClick={() => setForm(savedForm)}>Descartar cambios</button> : null}
              <button type="submit" className="btn-form-primary" disabled={saving || !dirty || "error" in draft}>
                <FaSave /><span>{saving ? "Guardando…" : current?.configurada ? "Guardar nueva versión" : "Guardar tarifa"}</span>
              </button>
            </div>
          </form> : <p className="parking-rate-muted">Solo un usuario con el módulo de tickets puede cambiarla.</p>}
        </>}
      </section>

      <section className="page-card parking-rate-card">
        <div className="modal-section-header"><FaCalculator className="modal-section-icon" /><h3 className="modal-section-title">Calculadora</h3></div>
        <p className="parking-rate-muted">{canEdit && dirty ? "Calcula con la tarifa que estás editando (sin guardar)." : "Calcula con la tarifa vigente."}</p>
        <div className="parking-rate-stay">
          <div className="form-group"><label htmlFor="stay-hours">Horas</label><input id="stay-hours" inputMode="numeric" value={stay.hours} onChange={(event) => setStay({ ...stay, hours: event.target.value })} /></div>
          <div className="form-group"><label htmlFor="stay-minutes">Minutos</label><input id="stay-minutes" inputMode="numeric" value={stay.minutes} onChange={(event) => setStay({ ...stay, minutes: event.target.value })} /></div>
        </div>
        {simulationError ? <p className="parking-rate-error">{simulationError}</p> : simulation ? <div className="parking-rate-result" aria-live="polite">
          <span className="parking-rate-result__label">Se cobraría</span>
          <strong className="parking-rate-result__amount">{formatMoney(simulation.amount)}</strong>
          <ul>{simulation.lines.map((line, index) => <li key={index}><span>{line.concept}</span><span>{formatMoney(line.amount)}</span></li>)}</ul>
        </div> : null}
      </section>
    </div>

    {canEdit && history.length ? <section className="page-card parking-rate-card">
      <div className="modal-section-header"><FaHistory className="modal-section-icon" /><h3 className="modal-section-title">Historial de cambios</h3></div>
      <ol className="parking-rate-history">
        {history.map((rate) => <li key={rate.id}>
          <div><strong>Versión {rate.version}</strong>{rate.version === current?.tarifa?.version ? <InfoChip tone="success">Vigente</InfoChip> : null}</div>
          <span>{rate.descripcion}</span>
          <span className="parking-rate-muted">{formatDate(rate.createdAt)}{rate.createdBy ? ` · usuario ${rate.createdBy.slice(0, 8)}` : ""}</span>
        </li>)}
      </ol>
    </section> : null}
  </div>;
}
