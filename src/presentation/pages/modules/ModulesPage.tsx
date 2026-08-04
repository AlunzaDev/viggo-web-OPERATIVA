import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
} from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ModuleEntity,
  type ModuleDeviceBindingRequest,
} from "../../../domain/entities/module.entity";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CrudRowActions } from "../../components/shared/CrudRowActions";
import { CrudStatusBadge } from "../../components/shared/CrudStatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { PageHeader } from "../../components/shared/PageHeader";
import { TableBase } from "../../components/shared/tables/TableBase";
import { useModules } from "../../hooks/modules/useModules";
import { useParkings } from "../../hooks/parkings/useParkings";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { ModuleDetailModal } from "../../components/modules/ModuleDetailModal";
import { ModuleModal } from "../../components/modules/ModuleModal";
import { ModuleRequestDetailModal } from "../../components/modules/ModuleRequestDetailModal";
import {
  buildPayload,
  INITIAL_FORM,
  type ModuloForm,
  type ProyectoOption,
} from "../../types/modules/moduleForm.types";
import {
  getBindingStatusClassName,
  getBindingStatusLabel,
} from "../../utils/modules/moduleDetail.utils";
import "../../styles/adminCrud/AdminCrud.css";

type ProjectRouteState = {
  projectName?: string;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function ModulesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId = "" } = useParams();
  const locationState = (location.state ?? {}) as ProjectRouteState;

  usePageTitle("Modulos del proyecto");

  const { parkings } = useParkings();
  const projects = useMemo<ProyectoOption[]>(
    () =>
      parkings.map((project) => ({
        id: project.id,
        nombre: project.nombre,
      })),
    [parkings],
  );

  const [form, setForm] = useState<ModuloForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ModuleEntity | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ModuleDeviceBindingRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    modules,
    isLoading,
    isSaving,
    isUpdating,
    isDeleting,
    isBindingActionRunning,
    error,
    page,
    pageSize,
    goToPage,
    changePageSize,
    createModule,
    updateModule,
    approveDeviceBinding,
    rejectDeviceBinding,
    reopenDeviceBinding,
    resetDeviceBinding,
  } = useModules(projectId);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.nombre])),
    [projects],
  );

  const selectedProjectName = useMemo(
    () =>
      locationState.projectName?.trim() ||
      projectById.get(projectId) ||
      projectId,
    [locationState.projectName, projectById, projectId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((item) => {
      if (!q) return true;
      return [
        item.nombre,
        item.identificador,
        item.tipo,
        projectById.get(item.proyecto) ?? item.proyecto,
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [modules, projectById, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) goToPage(totalPages);
  }, [goToPage, page, totalPages]);

  useEffect(() => {
    if (!selectedItem) return;

    const nextSelected = modules.find((module) => module.id === selectedItem.id) ?? null;
    setSelectedItem(nextSelected);
  }, [modules, selectedItem]);

  useEffect(() => {
    if (!selectedItem || !selectedRequest) return;

    const nextRequest =
      selectedItem.deviceBindingRequests.find(
        (request) =>
          request.fingerprint === selectedRequest.fingerprint &&
          request.requestedAt.toISOString() === selectedRequest.requestedAt.toISOString(),
      ) ?? null;

    setSelectedRequest(nextRequest);
  }, [selectedItem, selectedRequest]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...INITIAL_FORM,
      proyecto: projectId,
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: ModuleEntity) => {
    setSelectedItem(null);
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      proyecto: item.proyecto,
      tipo: item.tipo,
      identificador: item.identificador,
      descripcion: item.descripcion ?? "",
      estado: item.estado,
    });
    setIsModalOpen(true);
  };

  const save = async () => {
    const payload = buildPayload({
      ...form,
      proyecto: projectId,
    });

    if (editingId) {
      await updateModule(editingId, payload);
    } else {
      await createModule(payload);
    }

    setIsModalOpen(false);
  };

  const toggleModuleState = async (item: ModuleEntity) => {
    await updateModule(item.id, {
      nombre: item.nombre,
      proyecto: item.proyecto,
      tipo: item.tipo,
      identificador: item.identificador,
      descripcion: item.descripcion ?? "",
      estado: !item.estado,
    });
  };

  const handleApproveBinding = async (
    item: ModuleEntity,
    request: ModuleDeviceBindingRequest,
  ) => {
    if (!window.confirm(`Aprobar la huella pendiente de "${item.nombre}"?`)) return;
    await approveDeviceBinding(item.id, request.fingerprint);
  };

  const handleRejectBinding = async (
    item: ModuleEntity,
    request: ModuleDeviceBindingRequest,
  ) => {
    if (!window.confirm(`Rechazar la huella pendiente de "${item.nombre}"?`)) return;
    await rejectDeviceBinding(item.id, request.fingerprint);
  };

  const handleResetBinding = async (item: ModuleEntity) => {
    if (!window.confirm(`Desvincular el equipo autorizado de "${item.nombre}"?`)) return;
    await resetDeviceBinding(item.id);
  };

  const handleReopenBinding = async (
    item: ModuleEntity,
    request: ModuleDeviceBindingRequest,
  ) => {
    if (!window.confirm(`Regresar la solicitud de "${item.nombre}" a pendiente?`)) return;
    await reopenDeviceBinding(item.id, request.fingerprint);
  };

  return (
    <main className="admin-crud-page">
      <PageHeader
        eyebrow="Modulos del proyecto"
        title={selectedProjectName || "Proyecto"}
        subtitle="Aqui se muestran los modulos del proyecto seleccionado."
        backLabel="Volver a proyectos"
        onBack={() => navigate("/projects")}
      />

      <CrudActionsIsland
        searchValue={search}
        onSearchChange={(event) => {
          setSearch(event.target.value);
          goToPage(1);
        }}
        onSearchClear={() => {
          setSearch("");
          goToPage(1);
        }}
        searchPlaceholder="Buscar modulos"
        showCreate
        createLabel="Crear modulo"
        createIcon={<FaPlus />}
        onCreate={openCreate}
        isBusy={isLoading || isSaving}
      />

      {error ? <p className="admin-crud-error">{error}</p> : null}

      <TableBase
        withCard={false}
        isLoading={isLoading}
        isEmpty={visible.length === 0}
        emptyMessage={
          <EmptyState
            tone="empty"
            title="Sin modulos"
            description="No se encontraron modulos para este proyecto."
          />
        }
        page={page}
        pageSize={pageSize}
        totalItems={filtered.length}
        totalPages={totalPages}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        columns={
          <tr>
            <th>nombre</th>
            <th>proyecto</th>
            <th>tipo</th>
            <th>identificador</th>
            <th>submodulos</th>
            <th>vinculacion</th>
            <th className="col-status">estado</th>
            <th>acciones</th>
          </tr>
        }
      >
        {visible.map((item) => (
          <tr
            key={item.id}
            className="base-table__row"
          >
            <td>{item.nombre}</td>
            <td>{projectById.get(item.proyecto) ?? item.proyecto}</td>
            <td>
              <span className="admin-crud-pill">{item.tipo}</span>
            </td>
            <td>{item.identificador}</td>
            <td>{item.submodulos.length}</td>
            <td>
              <span className={getBindingStatusClassName(item)}>
                {getBindingStatusLabel(item)}
              </span>
            </td>
            <td className="col-status">
              <CrudStatusBadge label={item.estado ? "Activo" : "Inactivo"} variant={item.estado ? "active" : "inactive"} />
            </td>
            <td>
              <CrudRowActions
                entityName={`modulo ${item.nombre}`}
                isActive={item.estado}
                onView={() => setSelectedItem(item)}
                onEdit={() => openEdit(item)}
                onToggleStatus={() => toggleModuleState(item)}
              />
            </td>
          </tr>
        ))}
      </TableBase>

      <ModuleDetailModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        projectName={
          selectedItem
            ? projectById.get(selectedItem.proyecto) ?? selectedItem.proyecto
            : ""
        }
        isSubmitting={
          isSaving || isUpdating || isDeleting || isBindingActionRunning
        }
        error={error}
        onEdit={openEdit}
        onToggleStatus={toggleModuleState}
        onResetBinding={handleResetBinding}
        onOpenRequest={(item, request) => {
          setSelectedItem(item);
          setSelectedRequest(request);
        }}
        onClose={() => {
          setSelectedItem(null);
          setSelectedRequest(null);
        }}
      />

      <ModuleRequestDetailModal
        open={Boolean(selectedItem && selectedRequest)}
        item={selectedItem}
        request={selectedRequest}
        isSubmitting={isSaving || isUpdating || isDeleting || isBindingActionRunning}
        error={error}
        onApproveBinding={handleApproveBinding}
        onRejectBinding={handleRejectBinding}
        onReopenBinding={handleReopenBinding}
        onClose={() => setSelectedRequest(null)}
      />

      <ModuleModal
        open={isModalOpen}
        editing={Boolean(editingId)}
        form={form}
        projects={projects.filter((project) => project.id === projectId)}
        isSubmitting={isSaving || isUpdating || isBindingActionRunning}
        error={error}
        setForm={setForm}
        onClose={() => setIsModalOpen(false)}
        onSubmit={save}
      />
    </main>
  );
}
