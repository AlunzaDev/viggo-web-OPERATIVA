import { useCallback, useEffect, useMemo, useState } from "react";
import { FaAlignLeft, FaCalendarAlt, FaClock, FaDollarSign, FaEdit, FaInfoCircle, FaPlus, FaPowerOff, FaProjectDiagram, FaTicketAlt } from "react-icons/fa";
import { api } from "../../../infrastructure/http/axios.instance";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CopyableId } from "../../components/shared/CopyableId";
import { CreateModalBase } from "../../components/shared/modals/CreateModalBase";
import { UniqueModalBase } from "../../components/shared/modals/UniqueModalBase";
import { TableBase } from "../../components/shared/tables/TableBase";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import "../../styles/adminCrud/AdminCrud.css";
import "../../styles/pensions/PensionsPage.css";

type ValidezItem = { weekDay: number; from: number[]; to: number[] };
type Pension = { id: string; proyecto: string; nombre: string; validez: ValidezItem[]; precio: number; estado: boolean; descripcion?: string };
type ProyectoOption = { id: string; nombre: string };
type PensionForm = { proyecto: string; nombre: string; validez: ValidezItem[]; precio: string; descripcion: string; estado: boolean };

const DEFAULT_VALIDEZ: ValidezItem[] = Array.from({ length: 7 }, (_, weekDay) => ({ weekDay, from: [0, 0], to: [23, 59] }));
const WEEK_DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const cloneDefaultValidez = () => DEFAULT_VALIDEZ.map((item) => ({ ...item, from: [...item.from], to: [...item.to] }));
const INITIAL_FORM: PensionForm = { proyecto: "", nombre: "", validez: cloneDefaultValidez(), precio: "", descripcion: "", estado: true };
const PAGE_SIZE_OPTIONS = [5, 10, 20];
const asRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const getErrorMessage = (error: unknown, fallback: string) => {
  const data = asRecord(asRecord(asRecord(error).response).data);
  return String(data.error ?? data.message ?? fallback);
};
const normalizePension = (value: unknown): Pension => {
  const item = asRecord(value);
  return {
    id: String(item.id ?? item._id ?? ""),
    proyecto: String(item.proyecto ?? ""),
    nombre: String(item.nombre ?? ""),
    validez: Array.isArray(item.validez) ? item.validez as ValidezItem[] : [],
    precio: Number(item.precio ?? 0),
    estado: Boolean(item.estado ?? true),
    descripcion: typeof item.descripcion === "string" ? item.descripcion : undefined,
  };
};
const normalizeProyecto = (value: unknown): ProyectoOption => {
  const item = asRecord(value);
  return { id: String(item.id ?? item._id ?? ""), nombre: String(item.nombre ?? "") };
};
const normalizeValidez = (value: unknown): ValidezItem[] => {
  if (!Array.isArray(value) || value.length === 0) return cloneDefaultValidez();
  const parsed = value.map((item) => {
    const record = asRecord(item);
    return { weekDay: Number(record.weekDay), from: Array.isArray(record.from) ? record.from.map(Number) : [], to: Array.isArray(record.to) ? record.to.map(Number) : [] };
  });
  return cloneDefaultValidez().map((defaultItem) => parsed.find((item) => item.weekDay === defaultItem.weekDay) ?? defaultItem);
};
const formatTime = (value: number[]) => {
  const [hour = 0, minute = 0] = value;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};
const parseTime = (value: string): number[] => {
  const [hour = "0", minute = "0"] = value.split(":");
  return [Number(hour), Number(minute)];
};
const buildWeekSchedule = (from: number[], to: number[]) =>
  DEFAULT_VALIDEZ.map((item) => ({ ...item, from: [...from], to: [...to] }));

function PensionModal({
  open,
  editing,
  form,
  projects,
  isSubmitting,
  error,
  setForm,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  form: PensionForm;
  projects: ProyectoOption[];
  isSubmitting: boolean;
  error: string | null;
  setForm: (form: PensionForm) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const updateScheduleDay = (index: number, patch: Partial<Pick<ValidezItem, "from" | "to">>) => {
    const nextValidez = [...form.validez];
    nextValidez[index] = { ...nextValidez[index], ...patch };
    setForm({ ...form, validez: nextValidez });
  };

  const applyScheduleToAllDays = (from: number[], to: number[]) => {
    setForm({ ...form, validez: buildWeekSchedule(from, to) });
  };

  const copyMondayToAllDays = () => {
    const monday = form.validez.find((item) => item.weekDay === 1) ?? form.validez[0];
    applyScheduleToAllDays(monday.from, monday.to);
  };

  return (
    <CreateModalBase
      open={open}
      title={editing ? "Editar pension" : "Crear pension"}
      isSubmitting={isSubmitting}
      error={error}
      className="pension-modal"
      submitIcon={<FaTicketAlt />}
      submitText={editing ? "Guardar cambios" : "Guardar pension"}
      successToastMessage={editing ? "Pension actualizada" : "Pension creada"}
      onClose={onClose}
      onSubmit={async () => { await onSubmit(); }}
    >
      <section className="modal-form-section">
        <div className="modal-section-header"><FaTicketAlt className="modal-section-icon" /><h3 className="modal-section-title">Informacion de la pension</h3></div>
        <div className="modal-section-grid">
          <div className="form-group">
            <label htmlFor="pension-proyecto">Proyecto <span className="required">*</span></label>
            <select id="pension-proyecto" value={form.proyecto} onChange={(event) => setForm({ ...form, proyecto: event.target.value })} required>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pension-nombre">Nombre <span className="required">*</span></label>
            <input id="pension-nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Pension mensual" required />
          </div>
          <div className="form-group">
            <label htmlFor="pension-precio">Precio <span className="required">*</span></label>
            <input id="pension-precio" type="number" min="0" step="any" value={form.precio} onChange={(event) => setForm({ ...form, precio: event.target.value })} placeholder="0.00" required />
          </div>
          <div className="form-group modal-field-full">
            <label htmlFor="pension-descripcion">Descripcion</label>
            <textarea id="pension-descripcion" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} placeholder="Descripcion corta de la pension" />
          </div>
          {editing ? (
            <label className="admin-crud-switch modal-field-full"><span>Estado activo</span><input type="checkbox" checked={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.checked })} /></label>
          ) : null}
        </div>
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header"><FaCalendarAlt className="modal-section-icon" /><h3 className="modal-section-title">Calendario semanal</h3></div>
        <div className="pension-modal__preset-bar">
          <button type="button" onClick={() => applyScheduleToAllDays([0, 0], [23, 59])} disabled={isSubmitting}>
            24/7
          </button>
          <button type="button" onClick={() => applyScheduleToAllDays([8, 0], [20, 0])} disabled={isSubmitting}>
            08:00 - 20:00
          </button>
          <button type="button" onClick={copyMondayToAllDays} disabled={isSubmitting}>
            Copiar lunes
          </button>
        </div>
        <div className="pension-modal__calendar">
          {form.validez.map((item, index) => (
            <article className="pension-modal__day-card" key={item.weekDay}>
              <header>
                <span>{WEEK_DAYS[item.weekDay] ?? `Dia ${item.weekDay}`}</span>
                <small><FaClock /> {formatTime(item.from)} - {formatTime(item.to)}</small>
              </header>
              <label>
                <span>Desde</span>
                <input
                  type="time"
                  disabled={isSubmitting}
                  value={formatTime(item.from)}
                  onChange={(event) => updateScheduleDay(index, { from: parseTime(event.target.value) })}
                />
              </label>
              <label>
                <span>Hasta</span>
                <input
                  type="time"
                  disabled={isSubmitting}
                  value={formatTime(item.to)}
                  onChange={(event) => updateScheduleDay(index, { to: parseTime(event.target.value) })}
                />
              </label>
            </article>
          ))}
        </div>
      </section>
    </CreateModalBase>
  );
}

function PensionDetailModal({
  open,
  item,
  projectName,
  isSubmitting,
  error,
  onEdit,
  onToggleStatus,
  onClose,
}: {
  open: boolean;
  item: Pension | null;
  projectName: string;
  isSubmitting: boolean;
  error: string | null;
  onEdit: (item: Pension) => void;
  onToggleStatus: (item: Pension) => Promise<void>;
  onClose: () => void;
}) {
  const schedule = normalizeValidez(item?.validez);

  return (
    <UniqueModalBase
      open={open}
      title="Detalle de la pension"
      entityName={item?.nombre || "Pension"}
      className="admin-crud-detail-modal pension-detail-modal"
      isSubmitting={isSubmitting}
      error={error}
      isEntityActive={item?.estado ?? false}
      onClose={onClose}
      onEditStart={() => {
        if (item) onEdit(item);
      }}
      onToggleStatus={() => {
        if (!item) return Promise.resolve();
        return onToggleStatus(item);
      }}
      toggleStatusText={item?.estado ? "Desactivar" : "Activar"}
      toggleStatusIcon={<FaPowerOff />}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaTicketAlt className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion general</h3>
        </div>
        <div className="admin-crud-detail-hero">
          <div className="admin-crud-detail-hero__icon"><FaTicketAlt /></div>
          <div>
            <h4>{item?.nombre}</h4>
            {item ? <CopyableId value={item.id} copyLabel={`Copiar ID de ${item.nombre}`} /> : null}
          </div>
        </div>
        <div className="modal-section-grid">
          <article className="form-group admin-crud-detail-item">
            <label><FaProjectDiagram /> Proyecto</label>
            <p>{projectName}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label><FaDollarSign /> Precio</label>
            <p>{item?.precio}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Estado</label>
            <p>{item?.estado ? "Activo" : "Inactivo"}</p>
          </article>
          <article className="form-group modal-field-full admin-crud-detail-item">
            <label><FaAlignLeft /> Descripcion</label>
            <p>{item?.descripcion || <span className="admin-crud-detail-muted">Sin descripcion</span>}</p>
          </article>
        </div>
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaCalendarAlt className="modal-section-icon" />
          <h3 className="modal-section-title">Calendario semanal</h3>
        </div>
        <div className="pension-modal__calendar pension-modal__calendar--readonly">
          {schedule.map((scheduleItem) => (
            <article className="pension-modal__day-card" key={scheduleItem.weekDay}>
              <header>
                <span>{WEEK_DAYS[scheduleItem.weekDay] ?? `Dia ${scheduleItem.weekDay}`}</span>
                <small><FaClock /> {formatTime(scheduleItem.from)} - {formatTime(scheduleItem.to)}</small>
              </header>
            </article>
          ))}
        </div>
      </section>
    </UniqueModalBase>
  );
}

export function PensionsPage() {
  usePageTitle("Pensiones");
  const [items, setItems] = useState<Pension[]>([]);
  const [projects, setProjects] = useState<ProyectoOption[]>([]);
  const [form, setForm] = useState<PensionForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Pension | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project.nombre])), [projects]);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [pensionesResponse, proyectosResponse] = await Promise.all([
        api.get("/api/pensiones", { params: { page, limit: pageSize, search: search.trim() || undefined } }),
        api.get("/api/proyectos"),
      ]);
      const pensionesPayload = asRecord(pensionesResponse.data);
      const pensionesData = pensionesPayload.pensiones;
      const proyectosData = asRecord(proyectosResponse.data).proyectos;
      setItems(Array.isArray(pensionesData) ? pensionesData.map(normalizePension) : []);
      setProjects(Array.isArray(proyectosData) ? proyectosData.map(normalizeProyecto) : []);
      setTotalItems(Number(pensionesPayload.total ?? 0));
      setTotalPages(Math.max(1, Number(pensionesPayload.totalPages ?? 1)));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "No se pudieron cargar las pensiones"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);
  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openCreate = () => { setEditingId(null); setForm({ ...INITIAL_FORM, validez: cloneDefaultValidez(), proyecto: projects[0]?.id ?? "" }); setIsModalOpen(true); };
  const openEdit = (item: Pension) => { setSelectedItem(null); setEditingId(item.id); setForm({ proyecto: item.proyecto, nombre: item.nombre, validez: normalizeValidez(item.validez), precio: String(item.precio), descripcion: item.descripcion ?? "", estado: item.estado }); setIsModalOpen(true); };
  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload = { proyecto: form.proyecto, nombre: form.nombre.trim(), validez: form.validez, precio: Number(form.precio), descripcion: form.descripcion.trim() || undefined, estado: form.estado };
      if (editingId) await api.patch(`/api/pensiones/${editingId}`, payload);
      else await api.post("/api/pensiones", payload);
      setIsModalOpen(false); await loadData();
    } catch (saveError) {
      const message = getErrorMessage(saveError, "No se pudo guardar la pension");
      setError(message); throw new Error(message);
    } finally { setSaving(false); }
  };
  const toggleItemState = async (item: Pension) => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/pensiones/${item.id}`, {
        proyecto: item.proyecto,
        nombre: item.nombre.trim(),
        validez: normalizeValidez(item.validez),
        precio: Number(item.precio),
        descripcion: item.descripcion?.trim() || undefined,
        estado: !item.estado,
      });
      await loadData();
      setSelectedItem((current) => current?.id === item.id ? { ...current, estado: !item.estado } : current);
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "No se pudo actualizar el estado de la pension"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-crud-page">
      <CrudActionsIsland searchValue={search} onSearchChange={(event) => { setSearch(event.target.value); setPage(1); }} onSearchClear={() => { setSearch(""); setPage(1); }} searchPlaceholder="Buscar pensiones" showCreate createLabel="Crear pension" createIcon={<FaPlus />} onCreate={openCreate} isBusy={loading || saving} />
      {error ? <p className="admin-crud-error">{error}</p> : null}
      <TableBase withCard={false} isLoading={loading} isEmpty={items.length === 0} emptyMessage="No se encontraron pensiones." page={page} pageSize={pageSize} totalItems={totalItems} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} pageSizeOptions={PAGE_SIZE_OPTIONS} columns={<tr><th>nombre</th><th>proyecto</th><th>precio</th><th className="col-status">estado</th><th>acciones</th></tr>}>
        {items.map((item) => <tr key={item.id} className="base-table__row"><td>{item.nombre}</td><td>{projectById.get(item.proyecto) ?? item.proyecto}</td><td>{item.precio}</td><td className="col-status"><span className={`admin-crud-status ${item.estado ? "admin-crud-status--active" : "admin-crud-status--inactive"}`}>{item.estado ? "Activo" : "Inactivo"}</span></td><td><div className="admin-crud-row-actions"><button className="admin-crud-icon-button" type="button" onClick={(event) => { event.stopPropagation(); setSelectedItem(item); }} aria-label={`Ver detalle de pension ${item.nombre}`} title="Detalle"><FaInfoCircle /></button><button className="admin-crud-icon-button" type="button" onClick={(event) => { event.stopPropagation(); openEdit(item); }} aria-label={`Editar pension ${item.nombre}`} title="Editar"><FaEdit /></button><button className="admin-crud-icon-button admin-crud-icon-button--warning" type="button" onClick={(event) => { event.stopPropagation(); void toggleItemState(item); }} aria-label={`${item.estado ? "Desactivar" : "Activar"} pension ${item.nombre}`} title={item.estado ? "Desactivar" : "Activar"}><FaPowerOff /></button></div></td></tr>)}
      </TableBase>
      <PensionDetailModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        projectName={selectedItem ? projectById.get(selectedItem.proyecto) ?? selectedItem.proyecto : ""}
        isSubmitting={saving}
        error={error}
        onEdit={openEdit}
        onToggleStatus={toggleItemState}
        onClose={() => setSelectedItem(null)}
      />
      <PensionModal open={isModalOpen} editing={Boolean(editingId)} form={form} projects={projects} isSubmitting={saving} error={error} setForm={setForm} onClose={() => setIsModalOpen(false)} onSubmit={save} />
    </main>
  );
}
