import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaCheckCircle, FaEdit, FaIdCard, FaInfoCircle, FaParking, FaPlus, FaPowerOff, FaTicketAlt, FaUser } from "react-icons/fa";
import { api } from "../../../infrastructure/http/axios.instance";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CopyableId } from "../../components/shared/CopyableId";
import { CreateModalBase } from "../../components/shared/modals/CreateModalBase";
import { UniqueModalBase } from "../../components/shared/modals/UniqueModalBase";
import { TableBase } from "../../components/shared/tables/TableBase";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import "../../styles/adminCrud/AdminCrud.css";

type PensionPass = { id: string; usuario?: string; name: string; pension: string; idPass: string; vigent: boolean; antiPassback: boolean; inParking: boolean; created: number; from: number; to: number; estado: boolean };
type Option = { id: string; nombre: string };
type PensionPassForm = { name: string; pension: string; idPass: string; vigent: boolean; antiPassback: boolean; inParking: boolean; created: string; from: string; to: string; estado: boolean; usuario: string };

const INITIAL_FORM: PensionPassForm = { name: "", pension: "", idPass: "", vigent: false, antiPassback: true, inParking: false, created: String(Date.now()), from: "-1", to: "-1", estado: true, usuario: "" };
const PAGE_SIZE_OPTIONS = [5, 10, 20];
const asRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const getErrorMessage = (error: unknown, fallback: string) => { const data = asRecord(asRecord(asRecord(error).response).data); return String(data.error ?? data.message ?? fallback); };
const normalizePensionPass = (value: unknown): PensionPass => {
  const item = asRecord(value);
  return { id: String(item.id ?? item._id ?? ""), usuario: typeof item.usuario === "string" ? item.usuario : undefined, name: String(item.name ?? ""), pension: String(item.pension ?? ""), idPass: String(item.idPass ?? ""), vigent: Boolean(item.vigent), antiPassback: Boolean(item.antiPassback), inParking: Boolean(item.inParking), created: Number(item.created ?? 0), from: Number(item.from ?? -1), to: Number(item.to ?? -1), estado: Boolean(item.estado ?? true) };
};
const normalizePension = (value: unknown): Option => { const item = asRecord(value); return { id: String(item.id ?? item._id ?? ""), nombre: String(item.nombre ?? "") }; };
const normalizeUser = (value: unknown): Option => {
  const item = asRecord(value);
  const nombre = [item.nombre, item.apellido].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ");
  return { id: String(item.id ?? item._id ?? ""), nombre: nombre || String(item.correo ?? "") };
};
const buildPayload = (form: PensionPassForm) => ({ name: form.name.trim(), pension: form.pension, idPass: form.idPass.trim(), vigent: form.vigent, antiPassback: form.antiPassback, inParking: form.inParking, created: Number(form.created), from: Number(form.from), to: Number(form.to), estado: form.estado, usuario: form.usuario || undefined });
const formatUnixDate = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "Sin limite";
  return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};
const formatDateTimeInput = (value: string | number) => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp < 0) return "";
  const date = new Date(timestamp);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};
const parseDateTimeInput = (value: string) => value ? String(new Date(value).getTime()) : "-1";

function PensionPassModal({
  open,
  editing,
  form,
  pensions,
  users,
  isSubmitting,
  error,
  setForm,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  form: PensionPassForm;
  pensions: Option[];
  users: Option[];
  isSubmitting: boolean;
  error: string | null;
  setForm: (form: PensionPassForm) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <CreateModalBase open={open} title={editing ? "Editar pension-pass" : "Crear pension-pass"} isSubmitting={isSubmitting} error={error} className="admin-crud-detail-modal" submitIcon={<FaIdCard />} submitText={editing ? "Guardar cambios" : "Guardar pension-pass"} successToastMessage={editing ? "Pension-pass actualizado" : "Pension-pass creado"} onClose={onClose} onSubmit={async () => { await onSubmit(); }}>
      <section className="modal-form-section">
        <div className="modal-section-header"><FaIdCard className="modal-section-icon" /><h3 className="modal-section-title">Pension Pass</h3></div>
        <div className="modal-section-grid">
          <div className="form-group"><label htmlFor="pass-name">Nombre <span className="required">*</span></label><input id="pass-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Pension Juan Perez" required /></div>
          <div className="form-group"><label htmlFor="pass-pension">Pension <span className="required">*</span></label><select id="pass-pension" value={form.pension} onChange={(event) => setForm({ ...form, pension: event.target.value })} required>{pensions.map((pension) => <option key={pension.id} value={pension.id}>{pension.nombre}</option>)}</select></div>
          <div className="form-group"><label htmlFor="pass-idPass">ID Pass <span className="required">*</span></label><input id="pass-idPass" value={form.idPass} onChange={(event) => setForm({ ...form, idPass: event.target.value })} placeholder="Tarjeta, QR o folio" required /></div>
          <div className="form-group"><label htmlFor="pass-created">Fecha de alta</label><input id="pass-created" type="datetime-local" value={formatDateTimeInput(form.created)} onChange={(event) => setForm({ ...form, created: parseDateTimeInput(event.target.value) })} required /></div>
          <div className="form-group"><label htmlFor="pass-from">Inicio de vigencia</label><input id="pass-from" type="datetime-local" value={formatDateTimeInput(form.from)} onChange={(event) => setForm({ ...form, from: parseDateTimeInput(event.target.value) })} /></div>
          <div className="form-group"><label htmlFor="pass-to">Fin de vigencia</label><input id="pass-to" type="datetime-local" value={formatDateTimeInput(form.to)} onChange={(event) => setForm({ ...form, to: parseDateTimeInput(event.target.value) })} /></div>
          <div className="form-group modal-field-full"><label htmlFor="pass-usuario">Usuario</label><select id="pass-usuario" value={form.usuario} onChange={(event) => setForm({ ...form, usuario: event.target.value })}><option value="">Sin usuario</option>{users.map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}</select></div>
          <label className="admin-crud-switch"><span>Vigente</span><input type="checkbox" checked={form.vigent} onChange={(event) => setForm({ ...form, vigent: event.target.checked })} /></label>
          <label className="admin-crud-switch"><span>Anti-passback</span><input type="checkbox" checked={form.antiPassback} onChange={(event) => setForm({ ...form, antiPassback: event.target.checked })} /></label>
          <label className="admin-crud-switch"><span>Dentro del estacionamiento</span><input type="checkbox" checked={form.inParking} onChange={(event) => setForm({ ...form, inParking: event.target.checked })} /></label>
          {editing ? <label className="admin-crud-switch"><span>Estado activo</span><input type="checkbox" checked={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.checked })} /></label> : null}
        </div>
      </section>
    </CreateModalBase>
  );
}

function PensionPassDetailModal({
  open,
  item,
  pensionName,
  userName,
  isSubmitting,
  error,
  onEdit,
  onToggleStatus,
  onClose,
}: {
  open: boolean;
  item: PensionPass | null;
  pensionName: string;
  userName: string;
  isSubmitting: boolean;
  error: string | null;
  onEdit: (item: PensionPass) => void;
  onToggleStatus: (item: PensionPass) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <UniqueModalBase
      open={open}
      title="Detalle del pension-pass"
      entityName={item?.name || "Pension-pass"}
      className="admin-crud-detail-modal"
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
          <FaIdCard className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion general</h3>
        </div>
        <div className="admin-crud-detail-hero">
          <div className="admin-crud-detail-hero__icon"><FaIdCard /></div>
          <div>
            <h4>{item?.name}</h4>
            {item ? <CopyableId value={item.id} copyLabel={`Copiar ID de ${item.name}`} /> : null}
          </div>
        </div>
        <div className="modal-section-grid">
          <article className="form-group admin-crud-detail-item">
            <label><FaTicketAlt /> Pension</label>
            <p>{pensionName}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label><FaUser /> Usuario</label>
            <p>{userName}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>ID Pass</label>
            <p>{item?.idPass}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Estado</label>
            <p>{item?.estado ? "Activo" : "Inactivo"}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label><FaCalendarAlt /> Creado</label>
            <p>{item ? formatUnixDate(item.created) : ""}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Vigencia</label>
            <p>{item ? `${formatUnixDate(item.from)} - ${formatUnixDate(item.to)}` : ""}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label><FaCheckCircle /> Vigente</label>
            <p>{item?.vigent ? "Si" : "No"}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label><FaParking /> En estacionamiento</label>
            <p>{item?.inParking ? "Si" : "No"}</p>
          </article>
          <article className="form-group admin-crud-detail-item">
            <label>Anti-passback</label>
            <p>{item?.antiPassback ? "Activo" : "Inactivo"}</p>
          </article>
        </div>
      </section>
    </UniqueModalBase>
  );
}

export function PensionPassesPage() {
  usePageTitle("Pension Pass");
  const [items, setItems] = useState<PensionPass[]>([]);
  const [pensions, setPensions] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [form, setForm] = useState<PensionPassForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PensionPass | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pensionById = useMemo(() => new Map(pensions.map((pension) => [pension.id, pension.nombre])), [pensions]);
  const userById = useMemo(() => new Map(users.map((user) => [user.id, user.nombre])), [users]);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return items.filter((item) => !q || [item.name, item.idPass, pensionById.get(item.pension) ?? item.pension, item.usuario ? userById.get(item.usuario) ?? item.usuario : ""].some((value) => value.toLowerCase().includes(q))); }, [items, pensionById, search, userById]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [passesResponse, pensionsResponse, usersResponse] = await Promise.all([api.get("/api/pension-pass"), api.get("/api/pensiones"), api.get("/api/usuarios")]);
      const passesData = asRecord(passesResponse.data).pensionPasses;
      const pensionsData = asRecord(pensionsResponse.data).pensiones;
      const usersData = asRecord(usersResponse.data).usuarios;
      setItems(Array.isArray(passesData) ? passesData.map(normalizePensionPass) : []);
      setPensions(Array.isArray(pensionsData) ? pensionsData.map(normalizePension) : []);
      setUsers(Array.isArray(usersData) ? usersData.map(normalizeUser) : []);
    } catch (loadError) { setError(getErrorMessage(loadError, "No se pudieron cargar los pension-pass")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openCreate = () => { setEditingId(null); setForm({ ...INITIAL_FORM, created: String(Date.now()), pension: pensions[0]?.id ?? "" }); setIsModalOpen(true); };
  const openEdit = (item: PensionPass) => { setSelectedItem(null); setEditingId(item.id); setForm({ name: item.name, pension: item.pension, idPass: item.idPass, vigent: item.vigent, antiPassback: item.antiPassback, inParking: item.inParking, created: String(item.created), from: String(item.from), to: String(item.to), estado: item.estado, usuario: item.usuario ?? "" }); setIsModalOpen(true); };
  const save = async () => {
    setSaving(true); setError(null);
    try { if (editingId) await api.patch(`/api/pension-pass/${editingId}`, buildPayload(form)); else await api.post("/api/pension-pass", buildPayload(form)); setIsModalOpen(false); await loadData(); }
    catch (saveError) { const message = getErrorMessage(saveError, "No se pudo guardar el pension-pass"); setError(message); throw new Error(message); }
    finally { setSaving(false); }
  };
  const toggleItemState = async (item: PensionPass) => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/pension-pass/${item.id}`, {
        ...buildPayload({
          name: item.name,
          pension: item.pension,
          idPass: item.idPass,
          vigent: item.vigent,
          antiPassback: item.antiPassback,
          inParking: item.inParking,
          created: String(item.created),
          from: String(item.from),
          to: String(item.to),
          estado: !item.estado,
          usuario: item.usuario ?? "",
        }),
      });
      await loadData();
      setSelectedItem((current) => current?.id === item.id ? { ...current, estado: !item.estado } : current);
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "No se pudo actualizar el estado del pension-pass"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-crud-page">
      <CrudActionsIsland searchValue={search} onSearchChange={(event) => { setSearch(event.target.value); setPage(1); }} onSearchClear={() => { setSearch(""); setPage(1); }} searchPlaceholder="Buscar pension-pass" showCreate createLabel="Crear pension-pass" createIcon={<FaPlus />} onCreate={openCreate} isBusy={loading || saving} />
      {error ? <p className="admin-crud-error">{error}</p> : null}
      <TableBase withCard={false} isLoading={loading} isEmpty={visible.length === 0} emptyMessage="No se encontraron pension-pass." page={page} pageSize={pageSize} totalItems={filtered.length} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} pageSizeOptions={PAGE_SIZE_OPTIONS} columns={<tr><th>name</th><th>pension</th><th>usuario</th><th>idPass</th><th className="col-status">estado</th><th>acciones</th></tr>}>
        {visible.map((item) => <tr key={item.id} className="base-table__row"><td>{item.name}</td><td>{pensionById.get(item.pension) ?? item.pension}</td><td>{item.usuario ? userById.get(item.usuario) ?? item.usuario : "Sin usuario"}</td><td>{item.idPass}</td><td className="col-status"><span className={`admin-crud-status ${item.estado ? "admin-crud-status--active" : "admin-crud-status--inactive"}`}>{item.estado ? "Activo" : "Inactivo"}</span></td><td><div className="admin-crud-row-actions"><button className="admin-crud-icon-button" type="button" onClick={(event) => { event.stopPropagation(); setSelectedItem(item); }} aria-label={`Ver detalle de pension-pass ${item.name}`} title="Detalle"><FaInfoCircle /></button><button className="admin-crud-icon-button" type="button" onClick={(event) => { event.stopPropagation(); openEdit(item); }} aria-label={`Editar pension-pass ${item.name}`} title="Editar"><FaEdit /></button><button className="admin-crud-icon-button admin-crud-icon-button--warning" type="button" onClick={(event) => { event.stopPropagation(); void toggleItemState(item); }} aria-label={`${item.estado ? "Desactivar" : "Activar"} pension-pass ${item.name}`} title={item.estado ? "Desactivar" : "Activar"}><FaPowerOff /></button></div></td></tr>)}
      </TableBase>
      <PensionPassDetailModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        pensionName={selectedItem ? pensionById.get(selectedItem.pension) ?? selectedItem.pension : ""}
        userName={selectedItem?.usuario ? userById.get(selectedItem.usuario) ?? selectedItem.usuario : "Sin usuario"}
        isSubmitting={saving}
        error={error}
        onEdit={openEdit}
        onToggleStatus={toggleItemState}
        onClose={() => setSelectedItem(null)}
      />
      <PensionPassModal open={isModalOpen} editing={Boolean(editingId)} form={form} pensions={pensions} users={users} isSubmitting={saving} error={error} setForm={setForm} onClose={() => setIsModalOpen(false)} onSubmit={save} />
    </main>
  );
}
