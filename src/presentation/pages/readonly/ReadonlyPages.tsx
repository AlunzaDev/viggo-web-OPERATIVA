import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaCreditCard, FaExchangeAlt, FaParking, FaReceipt, FaTicketAlt, FaUser } from "react-icons/fa";
import { api } from "../../../infrastructure/http/axios.instance";
import {
  ReadonlyTablePage as SharedReadonlyTablePage,
} from "../../components/readonly/ReadonlyShared";
import { FilterSidebar } from "../../components/shared/FilterSidebar";
import { SidebarFilterField, SidebarFilterForm } from "../../components/shared/SidebarFilterForm";
import "../../styles/adminCrud/AdminCrud.css";

type AnyRecord = Record<string, unknown>;
type Option = { id: string; nombre: string };
const ALL_FILTER_VALUE = "__all__";
const toDateStartTimestamp = (value: string) => (value ? new Date(`${value}T00:00:00`).getTime() : undefined);
const toDateEndTimestamp = (value: string) => (value ? new Date(`${value}T23:59:59.999`).getTime() : undefined);
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);
  const [paymentFilter, setPaymentFilter] = useState(ALL_FILTER_VALUE);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [draftProjectFilter, setDraftProjectFilter] = useState(ALL_FILTER_VALUE);
  const [draftStatusFilter, setDraftStatusFilter] = useState(ALL_FILTER_VALUE);
  const [draftPaymentFilter, setDraftPaymentFilter] = useState(ALL_FILTER_VALUE);
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const projectById = useMemo(() => makeOptionMap(projects), [projects]);
  const moduleById = useMemo(() => makeOptionMap(modules), [modules]);
  const userById = useMemo(() => makeOptionMap(users), [users]);
  const activeFiltersCount = [projectFilter, statusFilter, paymentFilter].filter((value) => value !== ALL_FILTER_VALUE).length + [fromDate, toDate].filter(Boolean).length;

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ticketsResponse, projectsResponse, modulesResponse, usersResponse] = await Promise.all([
        api.get("/api/tickets", { params: { page, limit: pageSize, search: search.trim() || undefined, proyecto: projectFilter !== ALL_FILTER_VALUE ? projectFilter : undefined, status: statusFilter !== ALL_FILTER_VALUE ? statusFilter : undefined, pagado: paymentFilter !== ALL_FILTER_VALUE ? paymentFilter : undefined, from: toDateStartTimestamp(fromDate), to: toDateEndTimestamp(toDate) } }),
        api.get("/api/proyectos"),
        api.get("/api/modulos"),
        api.get("/api/usuarios"),
      ]);
      const ticketsPayload = asRecord(ticketsResponse.data);
      const tickets = ticketsPayload.tickets;
      setRows(Array.isArray(tickets) ? tickets.map((value) => {
        const item = asRecord(value);
        return { id: getId(item), proyecto: getText(item.proyecto), entrada: getText(item.entrada), salida: getText(item.salida), usuario: getText(item.usuario), idBoleto: getText(item.idBoleto), horaInicio: Number(item.horaInicio ?? -1), horaConsulta: Number(item.horaConsulta ?? -1), horaCobro: Number(item.horaCobro ?? -1), horaSalida: Number(item.horaSalida ?? -1), duracion: Number(item.duracion ?? 0), monto: Number(item.monto ?? 0), pagado: Boolean(item.pagado) };
      }) : []);
      setProjects(Array.isArray(asRecord(projectsResponse.data).proyectos) ? (asRecord(projectsResponse.data).proyectos as unknown[]).map((item) => normalizeOption(item)) : []);
      setModules(Array.isArray(asRecord(modulesResponse.data).modulos) ? (asRecord(modulesResponse.data).modulos as unknown[]).map((item) => normalizeOption(item)) : []);
      setUsers(Array.isArray(asRecord(usersResponse.data).usuarios) ? (asRecord(usersResponse.data).usuarios as unknown[]).map((item) => normalizeOption(item, ["nombre", "apellido", "correo"])) : []);
      setTotalItems(Number(ticketsPayload.total ?? 0));
      setTotalPages(Math.max(1, Number(ticketsPayload.totalPages ?? 1)));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "No se pudieron cargar los tickets"));
    } finally { setLoading(false); }
  }, [fromDate, page, pageSize, paymentFilter, projectFilter, search, statusFilter, toDate]);

  useEffect(() => { void loadData(); }, [loadData]);

  return <>
    <SharedReadonlyTablePage
      title="Tickets"
      searchPlaceholder="Buscar tickets"
      rows={rows}
      loading={loading}
      error={error}
      searchValue={search}
      onSearchValueChange={setSearch}
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      totalPages={totalPages}
      onPageChange={setPage}
      onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      showFilter
      isFilterOpen={isFilterOpen}
      onToggleFilter={() => {
        setDraftProjectFilter(projectFilter);
        setDraftStatusFilter(statusFilter);
        setDraftPaymentFilter(paymentFilter);
        setDraftFromDate(fromDate);
        setDraftToDate(toDate);
        setIsFilterOpen((prev) => !prev);
      }}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={() => {
        setProjectFilter(ALL_FILTER_VALUE);
        setStatusFilter(ALL_FILTER_VALUE);
        setPaymentFilter(ALL_FILTER_VALUE);
        setFromDate("");
        setToDate("");
        setDraftProjectFilter(ALL_FILTER_VALUE);
        setDraftStatusFilter(ALL_FILTER_VALUE);
        setDraftPaymentFilter(ALL_FILTER_VALUE);
        setDraftFromDate("");
        setDraftToDate("");
        setPage(1);
      }}
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
    />
    <FilterSidebar
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      onApply={() => {
        setProjectFilter(draftProjectFilter);
        setStatusFilter(draftStatusFilter);
        setPaymentFilter(draftPaymentFilter);
        setFromDate(draftFromDate);
        setToDate(draftToDate);
        setPage(1);
        setIsFilterOpen(false);
      }}
      onReset={() => {
        setDraftProjectFilter(ALL_FILTER_VALUE);
        setDraftStatusFilter(ALL_FILTER_VALUE);
        setDraftPaymentFilter(ALL_FILTER_VALUE);
        setDraftFromDate("");
        setDraftToDate("");
      }}
      title="Filtros de Tickets"
    >
      <SidebarFilterForm>
        <SidebarFilterField label="Proyecto" htmlFor="tickets-project-filter">
          <select id="tickets-project-filter" value={draftProjectFilter} onChange={(event) => setDraftProjectFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los proyectos</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Estatus" htmlFor="tickets-status-filter">
          <select id="tickets-status-filter" value={draftStatusFilter} onChange={(event) => setDraftStatusFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los estatus</option>
            <option value="ACTIVE">Activo</option>
            <option value="COMPLETED">Completado</option>
            <option value="FRAUD">Boleto fraude</option>
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Pago" htmlFor="tickets-payment-filter">
          <select id="tickets-payment-filter" value={draftPaymentFilter} onChange={(event) => setDraftPaymentFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los pagos</option>
            <option value="true">Pagado</option>
            <option value="false">Pendiente</option>
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Desde" htmlFor="tickets-from-date">
          <input id="tickets-from-date" type="date" value={draftFromDate} onChange={(event) => setDraftFromDate(event.target.value)} />
        </SidebarFilterField>
        <SidebarFilterField label="Hasta" htmlFor="tickets-to-date">
          <input id="tickets-to-date" type="date" value={draftToDate} onChange={(event) => setDraftToDate(event.target.value)} />
        </SidebarFilterField>
      </SidebarFilterForm>
    </FilterSidebar>
  </>;
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER_VALUE);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [draftProjectFilter, setDraftProjectFilter] = useState(ALL_FILTER_VALUE);
  const [draftTypeFilter, setDraftTypeFilter] = useState(ALL_FILTER_VALUE);
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const projectById = useMemo(() => makeOptionMap(projects), [projects]);
  const moduleById = useMemo(() => makeOptionMap(modules), [modules]);
  const passById = useMemo(() => makeOptionMap(passes), [passes]);
  const activeFiltersCount = [projectFilter, typeFilter].filter((value) => value !== ALL_FILTER_VALUE).length + [fromDate, toDate].filter(Boolean).length;

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [movesResponse, projectsResponse, modulesResponse, passesResponse] = await Promise.all([
        api.get("/api/pension-moves", { params: { page, limit: pageSize, search: search.trim() || undefined, proyecto: projectFilter !== ALL_FILTER_VALUE ? projectFilter : undefined, tipo: typeFilter !== ALL_FILTER_VALUE ? typeFilter : undefined, from: toDateStartTimestamp(fromDate), to: toDateEndTimestamp(toDate) } }),
        api.get("/api/proyectos"),
        api.get("/api/modulos"),
        api.get("/api/pension-pass"),
      ]);
      const movesPayload = asRecord(movesResponse.data);
      const moves = movesPayload.pensionMoves;
      setRows(Array.isArray(moves) ? moves.map((value) => { const item = asRecord(value); return { id: getId(item), modulo: getText(item.modulo), proyecto: getText(item.proyecto), pensionPass: getText(item.pensionPass), tipo: getText(item.tipo), fecha: Number(item.fecha ?? -1) }; }) : []);
      setProjects(Array.isArray(asRecord(projectsResponse.data).proyectos) ? (asRecord(projectsResponse.data).proyectos as unknown[]).map((item) => normalizeOption(item)) : []);
      setModules(Array.isArray(asRecord(modulesResponse.data).modulos) ? (asRecord(modulesResponse.data).modulos as unknown[]).map((item) => normalizeOption(item)) : []);
      setPasses(Array.isArray(asRecord(passesResponse.data).pensionPasses) ? (asRecord(passesResponse.data).pensionPasses as unknown[]).map((item) => normalizeOption(item, ["name", "idPass"])) : []);
      setTotalItems(Number(movesPayload.total ?? 0));
      setTotalPages(Math.max(1, Number(movesPayload.totalPages ?? 1)));
    } catch (loadError) { setError(getErrorMessage(loadError, "No se pudieron cargar los movimientos")); }
    finally { setLoading(false); }
  }, [fromDate, page, pageSize, projectFilter, search, toDate, typeFilter]);
  useEffect(() => { void loadData(); }, [loadData]);

  return <>
    <SharedReadonlyTablePage
    title="Movimientos"
    searchPlaceholder="Buscar movimientos"
    rows={rows}
    loading={loading}
    error={error}
    searchValue={search}
    onSearchValueChange={setSearch}
    page={page}
    pageSize={pageSize}
    totalItems={totalItems}
    totalPages={totalPages}
    onPageChange={setPage}
    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
    showFilter
    isFilterOpen={isFilterOpen}
    onToggleFilter={() => {
      setDraftProjectFilter(projectFilter);
      setDraftTypeFilter(typeFilter);
      setDraftFromDate(fromDate);
      setDraftToDate(toDate);
      setIsFilterOpen((prev) => !prev);
    }}
    activeFiltersCount={activeFiltersCount}
    onClearFilters={() => {
      setProjectFilter(ALL_FILTER_VALUE);
      setTypeFilter(ALL_FILTER_VALUE);
      setFromDate("");
      setToDate("");
      setDraftProjectFilter(ALL_FILTER_VALUE);
      setDraftTypeFilter(ALL_FILTER_VALUE);
      setDraftFromDate("");
      setDraftToDate("");
      setPage(1);
    }}
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
    />
    <FilterSidebar
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      onApply={() => {
        setProjectFilter(draftProjectFilter);
        setTypeFilter(draftTypeFilter);
        setFromDate(draftFromDate);
        setToDate(draftToDate);
        setPage(1);
        setIsFilterOpen(false);
      }}
      onReset={() => {
        setDraftProjectFilter(ALL_FILTER_VALUE);
        setDraftTypeFilter(ALL_FILTER_VALUE);
        setDraftFromDate("");
        setDraftToDate("");
      }}
      title="Filtros de Movimientos"
    >
      <SidebarFilterForm>
        <SidebarFilterField label="Proyecto" htmlFor="moves-project-filter">
          <select id="moves-project-filter" value={draftProjectFilter} onChange={(event) => setDraftProjectFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los proyectos</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Tipo" htmlFor="moves-type-filter">
          <select id="moves-type-filter" value={draftTypeFilter} onChange={(event) => setDraftTypeFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Desde" htmlFor="moves-from-date">
          <input id="moves-from-date" type="date" value={draftFromDate} onChange={(event) => setDraftFromDate(event.target.value)} />
        </SidebarFilterField>
        <SidebarFilterField label="Hasta" htmlFor="moves-to-date">
          <input id="moves-to-date" type="date" value={draftToDate} onChange={(event) => setDraftToDate(event.target.value)} />
        </SidebarFilterField>
      </SidebarFilterForm>
    </FilterSidebar>
  </>;
}

type PaymentRow = { id: string; type: string; concept: string; amount: number; currency: string; status: string; paidAt: number; reference?: AnyRecord; parking?: AnyRecord; paymentMethod?: AnyRecord };

export function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [draftTypeFilter, setDraftTypeFilter] = useState(ALL_FILTER_VALUE);
  const [draftStatusFilter, setDraftStatusFilter] = useState(ALL_FILTER_VALUE);
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const activeFiltersCount = [typeFilter, statusFilter].filter((value) => value !== ALL_FILTER_VALUE).length + [fromDate, toDate].filter(Boolean).length;
  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get("/api/payments/history", { params: { page, limit: pageSize, search: search.trim() || undefined, type: typeFilter !== ALL_FILTER_VALUE ? typeFilter : undefined, status: statusFilter !== ALL_FILTER_VALUE ? statusFilter : undefined, from: toDateStartTimestamp(fromDate), to: toDateEndTimestamp(toDate) } });
      const payload = asRecord(data);
      const payments = payload.payments;
      setRows(Array.isArray(payments) ? payments.map((value) => { const item = asRecord(value); return { id: getId(item), type: getText(item.type), concept: getText(item.concept), amount: Number(item.amount ?? 0), currency: getText(item.currency, "MXN"), status: getText(item.status), paidAt: Number(item.paidAt ?? -1), reference: asRecord(item.reference), parking: asRecord(item.parking), paymentMethod: asRecord(item.paymentMethod) }; }) : []);
      setTotalItems(Number(payload.total ?? 0));
      setTotalPages(Math.max(1, Number(payload.totalPages ?? 1)));
    } catch (loadError) { setError(getErrorMessage(loadError, "No se pudieron cargar los pagos")); }
    finally { setLoading(false); }
  }, [fromDate, page, pageSize, search, statusFilter, toDate, typeFilter]);
  useEffect(() => { void loadData(); }, [loadData]);

  return <>
    <SharedReadonlyTablePage
    title="Pagos"
    searchPlaceholder="Buscar pagos"
    rows={rows}
    loading={loading}
    error={error}
    searchValue={search}
    onSearchValueChange={setSearch}
    page={page}
    pageSize={pageSize}
    totalItems={totalItems}
    totalPages={totalPages}
    onPageChange={setPage}
    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
    showFilter
    isFilterOpen={isFilterOpen}
    onToggleFilter={() => {
      setDraftTypeFilter(typeFilter);
      setDraftStatusFilter(statusFilter);
      setDraftFromDate(fromDate);
      setDraftToDate(toDate);
      setIsFilterOpen((prev) => !prev);
    }}
    activeFiltersCount={activeFiltersCount}
    onClearFilters={() => {
      setTypeFilter(ALL_FILTER_VALUE);
      setStatusFilter(ALL_FILTER_VALUE);
      setFromDate("");
      setToDate("");
      setDraftTypeFilter(ALL_FILTER_VALUE);
      setDraftStatusFilter(ALL_FILTER_VALUE);
      setDraftFromDate("");
      setDraftToDate("");
      setPage(1);
    }}
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
    />
    <FilterSidebar
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      onApply={() => {
        setTypeFilter(draftTypeFilter);
        setStatusFilter(draftStatusFilter);
        setFromDate(draftFromDate);
        setToDate(draftToDate);
        setPage(1);
        setIsFilterOpen(false);
      }}
      onReset={() => {
        setDraftTypeFilter(ALL_FILTER_VALUE);
        setDraftStatusFilter(ALL_FILTER_VALUE);
        setDraftFromDate("");
        setDraftToDate("");
      }}
      title="Filtros de Pagos"
    >
      <SidebarFilterForm>
        <SidebarFilterField label="Tipo" htmlFor="payments-type-filter">
          <select id="payments-type-filter" value={draftTypeFilter} onChange={(event) => setDraftTypeFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los tipos</option>
            <option value="ticket">Ticket</option>
            <option value="pension">Pension</option>
            <option value="renewal">Renovacion</option>
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Estado" htmlFor="payments-status-filter">
          <select id="payments-status-filter" value={draftStatusFilter} onChange={(event) => setDraftStatusFilter(event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los estados</option>
            <option value="succeeded">Aprobado</option>
            <option value="pending">Pendiente</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </SidebarFilterField>
        <SidebarFilterField label="Desde" htmlFor="payments-from-date">
          <input id="payments-from-date" type="date" value={draftFromDate} onChange={(event) => setDraftFromDate(event.target.value)} />
        </SidebarFilterField>
        <SidebarFilterField label="Hasta" htmlFor="payments-to-date">
          <input id="payments-to-date" type="date" value={draftToDate} onChange={(event) => setDraftToDate(event.target.value)} />
        </SidebarFilterField>
      </SidebarFilterForm>
    </FilterSidebar>
  </>;
}
