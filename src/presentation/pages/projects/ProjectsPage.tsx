import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaEraser, FaInfoCircle, FaPlus, FaPowerOff, FaSortAlphaDown, FaSortAlphaDownAlt } from "react-icons/fa";
import { CreateProjectModal, type CreateProjectPayload } from "../../components/projects/CreateProjectModal/CreateProjectModal";
import { UniqueProjectModal } from "../../components/projects/UniqueProjectModal/UniqueProjectModal";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CopyableId } from "../../components/shared/CopyableId";
import { EmptyState } from "../../components/shared/EmptyState";
import { FilterSidebar } from "../../components/shared/FilterSidebar";
import { SidebarFilterField, SidebarFilterForm } from "../../components/shared/SidebarFilterForm";
import { InfoChip } from "../../components/shared/InfoChip";
import { MobileCardsList } from "../../components/shared/lists/MobileCardsList";
import { PageHeader } from "../../components/shared/PageHeader";
import { TableBase } from "../../components/shared/tables/TableBase";
import { useMediaQuery } from "../../hooks/shared/useMediaQuery";
import { useParkings } from "../../hooks/parkings/useParkings";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import type { ParkingEntity } from "../../../domain/entities/parking.entity";
import "../../styles/adminCrud/AdminCrud.css";
import "../../styles/projects/ProjectsPage.css";

const PAGE_SIZE_OPTIONS = [5, 10, 20];
type StatusFilter = "active" | "inactive" | "all";

const matchesStatusFilter = (active: boolean, filter: StatusFilter) => {
  if (filter === "all") return true;
  return filter === "active" ? active : !active;
};

export function ProjectsPage() {
  usePageTitle("Proyectos");
  const navigate = useNavigate();

  const isMobile = useMediaQuery("(max-width: 768px)");
  const shouldReduceMotion = useReducedMotion();
  const {
    parkings: projectRows,
    isLoading,
    isSaving,
    isUpdating,
    isDeleting,
    error: projectError,
    page,
    pageSize,
    goToPage,
    changePageSize,
    createParking: createProject,
    updateParking: updateProject,
    deleteParking: deleteProject,
  } = useParkings();

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [draftStatusFilter, setDraftStatusFilter] = useState<StatusFilter>("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ParkingEntity | null>(null);
  const [selectedProject, setSelectedProject] = useState<ParkingEntity | null>(null);

  const projects = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = projectRows.filter((project) => {
      if (!matchesStatusFilter(project.active, statusFilter)) return false;
      if (!q) return true;
      return (
        project.nombre.toLowerCase().includes(q) ||
        project.ciudad.toLowerCase().includes(q) ||
        project.identificador.toLowerCase().includes(q) ||
        project.descripcion.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const nameA = a.nombre.toLowerCase();
      const nameB = b.nombre.toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [projectRows, search, sortAsc, statusFilter]);

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    await createProject(payload);
    setIsCreateOpen(false);
  };

  const handleEditProject = async (payload: CreateProjectPayload) => {
    if (!editingProject) return;
    const updatedProject = await updateProject(editingProject.id, payload);
    setEditingProject(null);
    setSelectedProject(updatedProject);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setSelectedProject(null);
    setEditingProject((current) => (current?.id === id ? null : current));
  };

  const handleToggleProjectState = async (project: ParkingEntity) => {
    const updatedProject = await updateProject(project.id, {
      nombre: project.nombre,
      ciudad: project.ciudad,
      coordinates: project.coordinates,
      identificador: project.identificador,
      img: project.img,
      descripcion: project.descripcion,
      estado: !project.estado,
    });
    setSelectedProject((current) => (current?.id === project.id ? updatedProject : current));
  };

  const selectedProjectId = selectedProject?.id;
  useEffect(() => {
    if (!selectedProjectId) return;
    const refreshed = projectRows.find((project) => project.id === selectedProjectId);
    if (refreshed) setSelectedProject(refreshed);
  }, [projectRows, selectedProjectId]);

  const displayTotalItems = projects.length;
  const displayTotalPages = Math.max(1, Math.ceil(displayTotalItems / pageSize));
  const visibleProjects = projects.slice((page - 1) * pageSize, page * pageSize);
  const hasSearch = search.trim().length > 0;
  const activeFiltersCount = statusFilter !== "active" ? 1 : 0;
  const projectsCountLabel = projectRows.length === 1 ? "1 proyecto" : `${projectRows.length} proyectos`;
  const filteredProjectsLabel =
    hasSearch && displayTotalItems !== projectRows.length ? `${displayTotalItems} en esta busqueda` : null;

  useEffect(() => {
    if (page > displayTotalPages) {
      goToPage(displayTotalPages);
    }
  }, [displayTotalPages, goToPage, page]);

  const projectsEmptyMessage =
    projectError && projectRows.length === 0 ? (
      <EmptyState tone="error" title="No se pudieron cargar proyectos" description={projectError} />
    ) : projectRows.length === 0 ? (
      <EmptyState
        tone="empty"
        title="Aun no hay proyectos registrados"
        description="Crea el primer proyecto para empezar a administrar Viggo."
        actionLabel="Crear proyecto"
        actionIcon={<FaPlus aria-hidden="true" />}
        onAction={() => setIsCreateOpen(true)}
      />
    ) : hasSearch || activeFiltersCount > 0 ? (
      <EmptyState
        tone="filtered"
        title="Sin resultados para los filtros"
        description={`No hay proyectos que coincidan con "${search.trim()}".`}
        actionLabel="Limpiar filtros"
        actionIcon={<FaEraser aria-hidden="true" />}
        onAction={() => {
          setSearch("");
          setStatusFilter("active");
          setDraftStatusFilter("active");
          goToPage(1);
        }}
      />
    ) : (
      <EmptyState tone="empty" title="No hay proyectos disponibles" description="No se encontraron proyectos." />
    );

  const goToProjectDevices = (project: ParkingEntity) => {
    navigate(`/projects/${project.id}/modulos`, {
      state: { projectName: project.nombre },
    });
  };

  return (
    <div className="projects-page">
      <PageHeader
        title="Proyectos"
        hideTitle
        error={projectError && projectRows.length > 0 ? projectError : null}
        meta={
          <>
            <InfoChip>{projectsCountLabel}</InfoChip>
            {filteredProjectsLabel ? <InfoChip tone="accent">{filteredProjectsLabel}</InfoChip> : null}
          </>
        }
      />

      <CrudActionsIsland
        className="projects-island"
        searchValue={search}
        onSearchChange={(event) => {
          setSearch(event.target.value);
          goToPage(1);
        }}
        onSearchClear={() => {
          setSearch("");
          goToPage(1);
        }}
        searchPlaceholder="Buscar por nombre, ciudad o identificador"
        showFilter
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => {
          setDraftStatusFilter(statusFilter);
          setIsFilterOpen((prev) => !prev);
        }}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setStatusFilter("active");
          setDraftStatusFilter("active");
          goToPage(1);
        }}
        middleActions={
          <button
            type="button"
            className="crud-actions-island__action-btn crud-actions-island__action-btn--mobile-label"
            onClick={() => setSortAsc((prev) => !prev)}
          >
            {sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaDownAlt />}
            <span>{sortAsc ? "A-Z" : "Z-A"}</span>
          </button>
        }
        showCreate
        createIcon={<FaPlus />}
        createLabel="Crear proyecto"
        onCreate={() => setIsCreateOpen(true)}
      />

      <FilterSidebar
        open={isFilterOpen}
        title="Filtros de proyectos"
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {
          setStatusFilter(draftStatusFilter);
          goToPage(1);
          setIsFilterOpen(false);
        }}
        onReset={() => setDraftStatusFilter("active")}
      >
        <SidebarFilterForm>
          <SidebarFilterField label="Estado" htmlFor="project-status-filter">
            <select
              id="project-status-filter"
              value={draftStatusFilter}
              onChange={(event) => setDraftStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Todos</option>
            </select>
          </SidebarFilterField>
        </SidebarFilterForm>
      </FilterSidebar>

      <CreateProjectModal
        open={isCreateOpen}
        isSubmitting={isSaving}
        errorMessage={projectError}
        onClose={() => {
          if (isSaving) return;
          setIsCreateOpen(false);
        }}
        onSubmit={handleCreateProject}
      />

      <CreateProjectModal
        open={Boolean(editingProject)}
        mode="edit"
        initialValues={editingProject}
        isSubmitting={isUpdating}
        errorMessage={projectError}
        onClose={() => {
          if (isUpdating) return;
          setEditingProject(null);
        }}
        onSubmit={handleEditProject}
      />

      <UniqueProjectModal
        open={Boolean(selectedProject)}
        project={selectedProject}
        isSubmitting={isUpdating || isDeleting}
        errorMessage={projectError}
        onEdit={(project) => {
          setSelectedProject(null);
          setEditingProject(project);
        }}
        onToggleStatus={handleToggleProjectState}
        onDelete={handleDeleteProject}
        onClose={() => setSelectedProject(null)}
      />

      {isMobile ? (
        <MobileCardsList
          isLoading={isLoading}
          isEmpty={visibleProjects.length === 0}
          emptyMessage={projectsEmptyMessage}
          page={page}
          pageSize={pageSize}
          totalItems={displayTotalItems}
          totalPages={displayTotalPages}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSizeLabel="Tarjetas"
        >
          {visibleProjects.map((project, index) => (
            <motion.button
              key={project.id}
              type="button"
              className="mobile-data-card mobile-data-card--button"
              onClick={() => goToProjectDevices(project)}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.08 }
                  : { duration: 0.16, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.02, 0.15) }
              }
            >
              <div className="mobile-data-card__header">
                <div className="mobile-data-card__title-group">
                  <h3 className="mobile-data-card__title">{project.nombre}</h3>
                  <span className="mobile-data-card__subtitle">{project.identificador}</span>
                </div>
                <InfoChip className="app-status-pill" tone={project.estado ? "success" : "muted"}>{project.estado ? "Activo" : "Inactivo"}</InfoChip>
              </div>

              <div className="mobile-data-card__fields">
                <div className="mobile-data-card__field">
                  <span className="mobile-data-card__label">Ciudad</span>
                  <span className="mobile-data-card__value">{project.ciudad}</span>
                </div>
                <div className="mobile-data-card__field">
                  <span className="mobile-data-card__label">Coordenadas</span>
                  <span className="mobile-data-card__value">{project.latitude}, {project.longitude}</span>
                </div>
                <div className="mobile-data-card__field">
                  <span className="mobile-data-card__label">Descripcion</span>
                  <span className="mobile-data-card__value">{project.descripcion || "Sin descripcion"}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </MobileCardsList>
      ) : (
        <TableBase
          withCard={false}
          isLoading={isLoading}
          isEmpty={visibleProjects.length === 0}
          emptyMessage={projectsEmptyMessage}
          page={page}
          pageSize={pageSize}
          totalItems={displayTotalItems}
          totalPages={displayTotalPages}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          columns={
            <tr>
              <th className="col-name">Nombre</th>
              <th className="col-project-id">ID</th>
              <th>Identificador</th>
              <th>Ciudad</th>
              <th>Coordenadas</th>
              <th className="col-status">Estado</th>
              <th className="col-actions">Acciones</th>
            </tr>
          }
        >
          {visibleProjects.map((project, index) => (
            <motion.tr
              key={project.id}
              className="base-table__row clickable"
              onClick={() => goToProjectDevices(project)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  goToProjectDevices(project);
                }
              }}
              tabIndex={0}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.08 }
                  : { duration: 0.16, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.02, 0.15) }
              }
            >
              <td className="col-name" style={{ fontWeight: 600 }}>{project.nombre}</td>
              <td className="col-project-id">
                <CopyableId value={project.id} copyLabel={`Copiar ID de ${project.nombre}`} />
              </td>
              <td>{project.identificador}</td>
              <td>{project.ciudad}</td>
              <td>{project.latitude}, {project.longitude}</td>
              <td>
                <InfoChip className="app-status-pill" tone={project.estado ? "success" : "muted"}>{project.estado ? "Activo" : "Inactivo"}</InfoChip>
              </td>
              <td className="col-actions">
                <div className="admin-crud-row-actions">
                  <button
                    type="button"
                    className="admin-crud-action-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedProject(project);
                    }}
                    aria-label={`Abrir detalle de ${project.nombre}`}
                    title="Detalle"
                  >
                    <FaInfoCircle />
                  </button>
                  <button
                    type="button"
                    className="admin-crud-action-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingProject(project);
                    }}
                    aria-label={`Editar ${project.nombre}`}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    className="admin-crud-action-button admin-crud-action-button--warning"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleProjectState(project);
                    }}
                    aria-label={`${project.estado ? "Desactivar" : "Activar"} ${project.nombre}`}
                    title={project.estado ? "Desactivar" : "Activar"}
                  >
                    <FaPowerOff />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </TableBase>
      )}
    </div>
  );
}
