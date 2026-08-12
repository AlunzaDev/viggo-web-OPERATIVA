import { useCallback, useEffect, useMemo, useState } from "react";
import { FaAlignLeft, FaCalendarAlt, FaClock, FaDollarSign, FaPlus, FaPowerOff, FaProjectDiagram, FaTicketAlt } from "react-icons/fa";
import { getApiErrorMessage } from "../../../infrastructure/http/api-contracts";
import { loadProjectOptions } from "../../services/catalogs/catalog-options";
import { CrudRowActions } from "../../components/shared/CrudRowActions";
import { CrudStatusBadge } from "../../components/shared/CrudStatusBadge";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CopyableId } from "../../components/shared/CopyableId";
import { CreateModalBase } from "../../components/shared/modals/CreateModalBase";
import { UniqueModalBase } from "../../components/shared/modals/UniqueModalBase";
import { TableBase } from "../../components/shared/tables/TableBase";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { buildPensionForm, buildWeekSchedule, createInitialPensionForm, normalizeValidez, type PensionForm, type PensionRecord, type ValidezItem, WEEK_DAYS } from "../../services/pensions/pensions.contract";
import { loadPensionsPage, savePension, updatePensionStatus } from "../../services/pensions/pensions.api";
import "../../styles/adminCrud/AdminCrud.css";
import "../../styles/pensions/PensionsPage.css";

type Pension = PensionRecord;
type ProyectoOption = { id: string; nombre: string };

const INITIAL_FORM: PensionForm = createInitialPensionForm();
const PAGE_SIZE_OPTIONS = [5, 10, 20];
const getErrorMessage = (error: unknown, fallback: string) => getApiErrorMessage(error) ?? fallback;
const formatTime = (value: number[]) => {
  const [hour = 0, minute = 0] = value;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};
const parseTime = (value: string): number[] => {
  const [hour = "0", minute = "0"] = value.split(":");
  return [Number(hour), Number(minute)];
};
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
      const [pensionesResponse, proyectosData] = await Promise.all([
        loadPensionsPage(page, pageSize, search),
        loadProjectOptions(),
      ]);
      const pensionesPage = pensionesResponse;
      setItems(pensionesPage.items);
      setProjects(proyectosData);
      setTotalItems(pensionesPage.total);
      setTotalPages(Math.max(1, pensionesPage.totalPages));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "No se pudieron cargar las pensiones"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);
  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openCreate = () => { setEditingId(null); setForm({ ...createInitialPensionForm(), proyecto: projects[0]?.id ?? "" }); setIsModalOpen(true); };
  const openEdit = (item: Pension) => { setSelectedItem(null); setEditingId(item.id); setForm(buildPensionForm(item)); setIsModalOpen(true); };
  const save = async () => {
    setSaving(true); setError(null);
    try {
      await savePension(form, editingId);
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
      await updatePensionStatus(item.id, { ...buildPensionForm(item), estado: !item.estado });
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
        {items.map((item) => <tr key={item.id} className="base-table__row"><td>{item.nombre}</td><td>{projectById.get(item.proyecto) ?? item.proyecto}</td><td>{item.precio}</td><td className="col-status"><CrudStatusBadge label={item.estado ? "Activo" : "Inactivo"} variant={item.estado ? "active" : "inactive"} /></td><td><CrudRowActions entityName={`pension ${item.nombre}`} isActive={item.estado} onView={() => setSelectedItem(item)} onEdit={() => openEdit(item)} onToggleStatus={() => toggleItemState(item)} /></td></tr>)}
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
