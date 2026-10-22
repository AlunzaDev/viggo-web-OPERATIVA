import { useCallback, useEffect, useRef, useState } from "react";
import { FaCar, FaChartBar, FaIdCard, FaParking, FaSyncAlt, FaTicketAlt } from "react-icons/fa";
import { InfoChip } from "@alunzadev/viggo-ui";
import { PageHeader } from "../../components/shared/PageHeader";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { getOccupancy, type Occupancy } from "../../services/occupancy/occupancy.api";
import { OccupancyChart } from "./OccupancyChart";
import { formatParkingTime, formatStay, occupancyTone } from "../../services/occupancy/occupancy.format";
import "../../styles/occupancy/OccupancyPage.css";

/** Seconds between refreshes: the screen is meant to stay open at the booth. */
const REFRESH_MS = 15_000;

const errorMessage = (error: unknown) => (error instanceof Error && error.message ? error.message : "No se pudo cargar la ocupación");
const money = (value: number) => value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

/** How full this parking is: now, by hour today, and who is inside. */
export function OccupancyPage() {
  usePageTitle("Ocupación");
  const [data, setData] = useState<Occupancy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const active = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getOccupancy();
      if (!active.current) return;
      setData(next);
      setError(null);
    } catch (reason) {
      // The last figures stay on screen; the error says they may be old.
      if (active.current) setError(errorMessage(reason));
    } finally {
      if (active.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void load();
    const timer = setInterval(() => {
      // A hidden tab does not need fresh figures; it refreshes when shown again.
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const now = data?.ahora;
  const zone = data?.zonaHoraria ?? "America/Mexico_City";
  const tone = occupancyTone(now?.porcentaje ?? null);
  const hours = data?.hoy.horas ?? [];

  return <div className="occupancy-page">
    <PageHeader title="Ocupación" hideTitle error={error}
      meta={<>
        {data ? <InfoChip tone="muted">Actualizado {formatParkingTime(data.generadoEn, zone, data.generadoEn)}</InfoChip> : null}
        <button type="button" className="btn-form-secondary occupancy-refresh" onClick={() => void load()} disabled={loading}>
          <FaSyncAlt className={loading ? "occupancy-spin" : undefined} /> Actualizar
        </button>
      </>} />

    {!data ? <section className="page-card"><p className="occupancy-muted">{loading ? "Cargando…" : "Sin datos."}</p></section> : <>
      <div className="occupancy-cards">
        <section className={`page-card occupancy-card occupancy-card--${tone}`} aria-label="Ocupación">
          <span className="occupancy-card__label"><FaParking /> Ocupación</span>
          <strong className="occupancy-card__value">{now!.porcentaje !== null ? `${now!.porcentaje.toLocaleString("es-MX")} %` : "—"}</strong>
          {now!.capacidad !== null
            ? <div className="occupancy-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, now!.porcentaje ?? 0)}%` }} /></div>
            : <p className="occupancy-muted">Sin capacidad capturada: se captura en el proyecto, en ADMINISTRATIVO.</p>}
        </section>
        <section className="page-card occupancy-card" aria-label="Autos dentro">
          <span className="occupancy-card__label"><FaCar /> Autos dentro</span>
          <strong className="occupancy-card__value">{now!.autosDentro.toLocaleString("es-MX")}</strong>
          <p className="occupancy-muted">{now!.tickets} con ticket · {now!.pensionados} pensionados</p>
        </section>
        <section className="page-card occupancy-card" aria-label="Lugares libres">
          <span className="occupancy-card__label"><FaParking /> Lugares libres</span>
          <strong className="occupancy-card__value">{now!.lugaresLibres !== null ? now!.lugaresLibres.toLocaleString("es-MX") : "—"}</strong>
          <p className="occupancy-muted">{now!.capacidad !== null ? `de ${now!.capacidad.toLocaleString("es-MX")} lugares` : "Sin capacidad capturada"}</p>
        </section>
      </div>

      <section className="page-card occupancy-section">
        <div className="modal-section-header"><FaChartBar className="modal-section-icon" /><h3 className="modal-section-title">Hoy por hora</h3></div>
        <p className="occupancy-muted">Autos dentro al inicio de cada hora, con las entradas y salidas de esa hora{now!.capacidad !== null ? "; la línea es la capacidad" : ""}.</p>
        <OccupancyChart hours={hours} capacity={now!.capacidad} />
      </section>

      <div className="occupancy-lists">
        <section className="page-card occupancy-section">
          <div className="modal-section-header"><FaTicketAlt className="modal-section-icon" /><h3 className="modal-section-title">Tickets abiertos</h3>
            <InfoChip tone="muted">{data.ticketsAbiertos.total}</InfoChip></div>
          {!data.ticketsAbiertos.items.length ? <p className="occupancy-muted">No hay tickets abiertos.</p> : <>
            <table className="occupancy-table">
              <thead><tr><th>Boleto</th><th>Entrada</th><th>Tiempo dentro</th><th>Pago</th></tr></thead>
              <tbody>{data.ticketsAbiertos.items.map((ticket) => <tr key={ticket.id} className={ticket.olvidado ? "occupancy-row--forgotten" : undefined}>
                <td className="occupancy-mono">{ticket.idBoleto}</td>
                <td>{formatParkingTime(ticket.horaInicio, zone, data.generadoEn)}</td>
                <td>{formatStay(ticket.minutosDentro)}{ticket.olvidado ? <> <InfoChip tone="warning">Más de 7 días</InfoChip></> : null}</td>
                <td>{ticket.pagado ? money(ticket.monto) : "Pendiente"}</td>
              </tr>)}</tbody>
            </table>
            {data.ticketsAbiertos.total > data.ticketsAbiertos.items.length
              ? <p className="occupancy-muted">Se muestran los {data.ticketsAbiertos.items.length} más antiguos de {data.ticketsAbiertos.total}.</p> : null}
            {data.ticketsAbiertos.items.some((ticket) => ticket.olvidado)
              ? <p className="occupancy-muted">Los de más de 7 días ya no cuentan como autos dentro: probablemente salieron sin registrar la salida.</p> : null}
          </>}
        </section>

        <section className="page-card occupancy-section">
          <div className="modal-section-header"><FaIdCard className="modal-section-icon" /><h3 className="modal-section-title">Pensionados dentro</h3>
            <InfoChip tone="muted">{data.pensionadosDentro.total}</InfoChip></div>
          {!data.pensionadosDentro.items.length ? <p className="occupancy-muted">No hay pensionados dentro.</p> :
            <table className="occupancy-table">
              <thead><tr><th>Pase</th><th>Titular</th><th>Pensión</th><th>Entró</th></tr></thead>
              <tbody>{data.pensionadosDentro.items.map((pass) => <tr key={pass.pensionPassId}>
                <td>{pass.nombre} <span className="occupancy-muted occupancy-mono">{pass.idPass}</span></td>
                <td>{pass.titular ?? "—"}</td>
                <td>{pass.pension}</td>
                <td>{pass.desde !== null ? formatParkingTime(pass.desde, zone, data.generadoEn) : "—"}</td>
              </tr>)}</tbody>
            </table>}
        </section>
      </div>
    </>}
  </div>;
}
