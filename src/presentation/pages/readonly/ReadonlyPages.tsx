import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FaCalendarAlt, FaCreditCard, FaExchangeAlt, FaParking, FaReceipt, FaTicketAlt, FaUser } from "react-icons/fa";
import { api } from "../../../infrastructure/http/axios.instance";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CopyableId } from "../../components/shared/CopyableId";
import { UniqueModalBase } from "../../components/shared/modals/UniqueModalBase";
import { TableBase } from "../../components/shared/tables/TableBase";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import "../../styles/adminCrud/AdminCrud.css";

type AnyRecord = Record<string, unknown>;
type Option = { id: string; nombre: string };
type DetailField = { label: string; value: ReactNode; icon?: ReactNode };

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const asRecord = (value: unknown): AnyRecord => typeof value === "object" && value !== null && !Array.isArray(value) ? value as AnyRecord : {};
const getId = (value: unknown) => String(asRecord(value).id ?? asRecord(value)._id ?? "");
const getText = (value: unknown, fallback = "") => String(value ?? fallback);
const getErrorMessage = (error: unknown, fallback: string) => {
  const data = asRecord(asRecord(asRecord(error).response).data);
  return String(data.error ?? data.message ?? fallback);
};
const formatDate = (value: unknown) => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp < 0) return "Sin registro";
  return new Date(timestamp).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};
const formatMoney = (value: unknown, currency = "MXN") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
};
const normalizeOption = (value: unknown, nameKeys: string[] = ["nombre", "name", "correo"]): Option => {
  const record = asRecord(value);
  const nombre = nameKeys.map((key) => String(record[key] ?? "").trim()).filter(Boolean).join(" ");
  return { id: getId(value), nombre: nombre || getId(value) };
};
const makeOptionMap = (values: Option[]) => new Map(values.map((item) => [item.id, item.nombre]));

function DetailModal({
  open,
  title,
  entityName,
  icon,
  itemId,
  fields,
  onClose,
}: {
  open: boolean;
  title: string;
  entityName: string;
  icon: ReactNode;
  itemId?: string;
  fields: DetailField[];
  onClose: () => void;
}) {
  return (
    <UniqueModalBase
      open={open}
      title={title}
      entityName={entityName}
      className="admin-crud-detail-modal"
      onClose={onClose}
      showEditAction={false}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">{icon}<h3 className="modal-section-title">Informacion</h3></div>
        <div className="admin-crud-detail-hero">
          <div className="admin-crud-detail-hero__icon">{icon}</div>
          <div>
            <h4>{entityName}</h4>
            {itemId ? <CopyableId value={itemId} copyLabel={`Copiar ID de ${entityName}`} /> : null}
          </div>
        </div>
        <div className="modal-section-grid">
          {fields.map((field) => (
            <article className="form-group admin-crud-detail-item" key={field.label}>
              <label>{field.icon} {field.label}</label>
              <p>{field.value}</p>
            </article>
          ))}
        </div>
      </section>
    </UniqueModalBase>
  );
}

function ReadonlyTable<T extends { id: string }>({
  title,
  searchPlaceholder,
  rows,
  loading,
  error,
  columns,
  renderRow,
  getSearchText,
  selected,
  detailTitle,
  detailIcon,
  getDetailName,
  getDetailFields,
  onSelect,
  onCloseDetail,
}: {
  title: string;
  searchPlaceholder: string;
  rows: T[];
  loading: boolean;
  error: string | null;
  columns: ReactNode;
  renderRow: (item: T) => ReactNode;
  getSearchText: (item: T) => string;
  selected: T | null;
  detailTitle: string;
  detailIcon: ReactNode;
  getDetailName: (item: T) => string;
  getDetailFields: (item: T) => DetailField[];
  onSelect: (item: T) => void;
  onCloseDetail: () => void;
}) {
  usePageTitle(title);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) => !q || getSearchText(item).toLowerCase().includes(q));
  }, [getSearchText, rows, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <main className="admin-crud-page">
      <CrudActionsIsland
        searchValue={search}
        onSearchChange={(event) => { setSearch(event.target.value); setPage(1); }}
        onSearchClear={() => { setSearch(""); setPage(1); }}
        searchPlaceholder={searchPlaceholder}
        isBusy={loading}
      />
      {error ? <p className="admin-crud-error">{error}</p> : null}
      <TableBase withCard={false} isLoading={loading} isEmpty={visible.length === 0} emptyMessage="No hay registros." page={page} pageSize={pageSize} totalItems={filtered.length} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} pageSizeOptions={PAGE_SIZE_OPTIONS} columns={columns}>
        {visible.map((item) => (
          <tr key={item.id} className="base-table__row" tabIndex={0} onClick={() => onSelect(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item); } }}>
            {renderRow(item)}
          </tr>
        ))}
      </TableBase>
      <DetailModal
        open={Boolean(selected)}
        title={detailTitle}
        entityName={selected ? getDetailName(selected) : ""}
        icon={detailIcon}
        itemId={selected?.id}
        fields={selected ? getDetailFields(selected) : []}
        onClose={onCloseDetail}
      />
    </main>
  );
}

type TicketRow = {
  id: string; proyecto: string; entrada: string; salida: string; usuario: string; idBoleto: string; horaInicio: number; horaConsulta: number; horaCobro: number; horaSalida: number; duracion: number; monto: number; pagado: boolean;
};

export function TicketsPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [modules, setModules] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [selected, setSelected] = useState<TicketRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectById = useMemo(() => makeOptionMap(projects), [projects]);
  const moduleById = useMemo(() => makeOptionMap(modules), [modules]);
  const userById = useMemo(() => makeOptionMap(users), [users]);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ticketsResponse, projectsResponse, modulesResponse, usersResponse] = await Promise.all([api.get("/api/tickets"), api.get("/api/proyectos"), api.get("/api/modulos"), api.get("/api/usuarios")]);
      const tickets = asRecord(ticketsResponse.data).tickets;
      setRows(Array.isArray(tickets) ? tickets.map((value) => {
        const item = asRecord(value);
        return { id: getId(item), proyecto: getText(item.proyecto), entrada: getText(item.entrada), salida: getText(item.salida), usuario: getText(item.usuario), idBoleto: getText(item.idBoleto), horaInicio: Number(item.horaInicio ?? -1), horaConsulta: Number(item.horaConsulta ?? -1), horaCobro: Number(item.horaCobro ?? -1), horaSalida: Number(item.horaSalida ?? -1), duracion: Number(item.duracion ?? 0), monto: Number(item.monto ?? 0), pagado: Boolean(item.pagado) };
      }) : []);
      setProjects(Array.isArray(asRecord(projectsResponse.data).proyectos) ? (asRecord(projectsResponse.data).proyectos as unknown[]).map((item) => normalizeOption(item)) : []);
      setModules(Array.isArray(asRecord(modulesResponse.data).modulos) ? (asRecord(modulesResponse.data).modulos as unknown[]).map((item) => normalizeOption(item)) : []);
      setUsers(Array.isArray(asRecord(usersResponse.data).usuarios) ? (asRecord(usersResponse.data).usuarios as unknown[]).map((item) => normalizeOption(item, ["nombre", "apellido", "correo"])) : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "No se pudieron cargar los tickets"));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return <ReadonlyTable
    title="Tickets"
    searchPlaceholder="Buscar tickets"
    rows={rows}
    loading={loading}
    error={error}
    columns={<tr><th>boleto</th><th>proyecto</th><th>usuario</th><th>inicio</th><th className="col-status">pago</th></tr>}
    renderRow={(item) => <><td>{item.idBoleto}</td><td>{projectById.get(item.proyecto) ?? item.proyecto}</td><td>{userById.get(item.usuario) ?? item.usuario}</td><td>{formatDate(item.horaInicio)}</td><td className="col-status"><span className={`admin-crud-status ${item.pagado ? "admin-crud-status--active" : "admin-crud-status--inactive"}`}>{item.pagado ? "Pagado" : "Pendiente"}</span></td></>}
    getSearchText={(item) => [item.idBoleto, projectById.get(item.proyecto), userById.get(item.usuario)].join(" ")}
    selected={selected}
    detailTitle="Detalle del ticket"
    detailIcon={<FaTicketAlt className="modal-section-icon" />}
    getDetailName={(item) => item.idBoleto}
    getDetailFields={(item) => [
      { label: "Proyecto", value: projectById.get(item.proyecto) ?? item.proyecto, icon: <FaParking /> },
      { label: "Usuario", value: userById.get(item.usuario) ?? item.usuario, icon: <FaUser /> },
      { label: "Entrada", value: moduleById.get(item.entrada) ?? item.entrada },
      { label: "Salida", value: moduleById.get(item.salida) ?? (item.salida || "Sin salida") },
      { label: "Inicio", value: formatDate(item.horaInicio), icon: <FaCalendarAlt /> },
      { label: "Consulta", value: formatDate(item.horaConsulta), icon: <FaCalendarAlt /> },
      { label: "Cobro", value: formatDate(item.horaCobro), icon: <FaCalendarAlt /> },
      { label: "Salida hora", value: formatDate(item.horaSalida), icon: <FaCalendarAlt /> },
      { label: "Duracion", value: item.duracion },
      { label: "Monto", value: formatMoney(item.monto), icon: <FaReceipt /> },
      { label: "Pago", value: item.pagado ? "Pagado" : "Pendiente" },
    ]}
    onSelect={setSelected}
    onCloseDetail={() => setSelected(null)}
  />;
}

type MoveRow = { id: string; modulo: string; proyecto: string; pensionPass: string; tipo: string; fecha: number };

export function PensionMovesPage() {
  const [rows, setRows] = useState<MoveRow[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [modules, setModules] = useState<Option[]>([]);
  const [passes, setPasses] = useState<Option[]>([]);
  const [selected, setSelected] = useState<MoveRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projectById = useMemo(() => makeOptionMap(projects), [projects]);
  const moduleById = useMemo(() => makeOptionMap(modules), [modules]);
  const passById = useMemo(() => makeOptionMap(passes), [passes]);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [movesResponse, projectsResponse, modulesResponse, passesResponse] = await Promise.all([api.get("/api/pension-moves"), api.get("/api/proyectos"), api.get("/api/modulos"), api.get("/api/pension-pass")]);
      const moves = asRecord(movesResponse.data).pensionMoves;
      setRows(Array.isArray(moves) ? moves.map((value) => { const item = asRecord(value); return { id: getId(item), modulo: getText(item.modulo), proyecto: getText(item.proyecto), pensionPass: getText(item.pensionPass), tipo: getText(item.tipo), fecha: Number(item.fecha ?? -1) }; }) : []);
      setProjects(Array.isArray(asRecord(projectsResponse.data).proyectos) ? (asRecord(projectsResponse.data).proyectos as unknown[]).map((item) => normalizeOption(item)) : []);
      setModules(Array.isArray(asRecord(modulesResponse.data).modulos) ? (asRecord(modulesResponse.data).modulos as unknown[]).map((item) => normalizeOption(item)) : []);
      setPasses(Array.isArray(asRecord(passesResponse.data).pensionPasses) ? (asRecord(passesResponse.data).pensionPasses as unknown[]).map((item) => normalizeOption(item, ["name", "idPass"])) : []);
    } catch (loadError) { setError(getErrorMessage(loadError, "No se pudieron cargar los movimientos")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  return <ReadonlyTable
    title="Movimientos"
    searchPlaceholder="Buscar movimientos"
    rows={rows}
    loading={loading}
    error={error}
    columns={<tr><th>tipo</th><th>proyecto</th><th>modulo</th><th>pension pass</th><th>fecha</th></tr>}
    renderRow={(item) => <><td><span className="admin-crud-pill">{item.tipo}</span></td><td>{projectById.get(item.proyecto) ?? item.proyecto}</td><td>{moduleById.get(item.modulo) ?? item.modulo}</td><td>{passById.get(item.pensionPass) ?? item.pensionPass}</td><td>{formatDate(item.fecha)}</td></>}
    getSearchText={(item) => [item.tipo, projectById.get(item.proyecto), moduleById.get(item.modulo), passById.get(item.pensionPass)].join(" ")}
    selected={selected}
    detailTitle="Detalle del movimiento"
    detailIcon={<FaExchangeAlt className="modal-section-icon" />}
    getDetailName={(item) => item.tipo}
    getDetailFields={(item) => [
      { label: "Tipo", value: item.tipo },
      { label: "Proyecto", value: projectById.get(item.proyecto) ?? item.proyecto, icon: <FaParking /> },
      { label: "Modulo", value: moduleById.get(item.modulo) ?? item.modulo },
      { label: "Pension Pass", value: passById.get(item.pensionPass) ?? item.pensionPass },
      { label: "Fecha", value: formatDate(item.fecha), icon: <FaCalendarAlt /> },
    ]}
    onSelect={setSelected}
    onCloseDetail={() => setSelected(null)}
  />;
}

type PaymentRow = { id: string; type: string; concept: string; amount: number; currency: string; status: string; paidAt: number; reference?: AnyRecord; parking?: AnyRecord; paymentMethod?: AnyRecord };

export function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get("/api/payments/history", { params: { limit: 100 } });
      const payments = asRecord(data).payments;
      setRows(Array.isArray(payments) ? payments.map((value) => { const item = asRecord(value); return { id: getId(item), type: getText(item.type), concept: getText(item.concept), amount: Number(item.amount ?? 0), currency: getText(item.currency, "MXN"), status: getText(item.status), paidAt: Number(item.paidAt ?? -1), reference: asRecord(item.reference), parking: asRecord(item.parking), paymentMethod: asRecord(item.paymentMethod) }; }) : []);
    } catch (loadError) { setError(getErrorMessage(loadError, "No se pudieron cargar los pagos")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  return <ReadonlyTable
    title="Pagos"
    searchPlaceholder="Buscar pagos"
    rows={rows}
    loading={loading}
    error={error}
    columns={<tr><th>concepto</th><th>tipo</th><th>monto</th><th>fecha</th><th className="col-status">estado</th></tr>}
    renderRow={(item) => <><td>{item.concept}</td><td>{item.type}</td><td>{formatMoney(item.amount, item.currency)}</td><td>{formatDate(item.paidAt)}</td><td className="col-status"><span className={`admin-crud-status ${item.status === "succeeded" ? "admin-crud-status--active" : "admin-crud-status--inactive"}`}>{item.status}</span></td></>}
    getSearchText={(item) => [item.concept, item.type, item.status, item.parking?.name].join(" ")}
    selected={selected}
    detailTitle="Detalle del pago"
    detailIcon={<FaCreditCard className="modal-section-icon" />}
    getDetailName={(item) => item.concept}
    getDetailFields={(item) => [
      { label: "Tipo", value: item.type },
      { label: "Concepto", value: item.concept, icon: <FaReceipt /> },
      { label: "Monto", value: formatMoney(item.amount, item.currency), icon: <FaCreditCard /> },
      { label: "Estado", value: item.status },
      { label: "Pagado", value: formatDate(item.paidAt), icon: <FaCalendarAlt /> },
      { label: "Referencia", value: `${getText(item.reference?.type)} ${getText(item.reference?.id)}` },
      { label: "Estacionamiento", value: getText(item.parking?.name, "Sin estacionamiento"), icon: <FaParking /> },
      { label: "Metodo", value: [item.paymentMethod?.brand, item.paymentMethod?.last4 ? `**** ${item.paymentMethod.last4}` : ""].filter(Boolean).join(" ") || "Sin metodo" },
    ]}
    onSelect={setSelected}
    onCloseDetail={() => setSelected(null)}
  />;
}
