import { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaCircle,
  FaEnvelope,
  FaIdBadge,
  FaMapMarkerAlt,
  FaPhone,
  FaSearch,
  FaUser,
  FaUserCheck,
  FaUserSlash,
} from "react-icons/fa";
import type { UserEntity, UserRole } from "../../../../domain/entities/user.entity";
import { api } from "../../../../infrastructure/http/axios.instance";
import { UniqueModalBase } from "../../shared/modals/UniqueModalBase";
import "../../../styles/users/UniqueUserModal.css";

type UniqueUserModalProps = {
  open: boolean;
  user: UserEntity | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onEdit: (user: UserEntity) => void;
  onToggleStatus: (userId: string, nextState: boolean) => Promise<void> | void;
  onClose: () => void;
};

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ROLE: "Super Administrador",
  ADMIN_ROLE: "Administrador",
  PENSION_ROLE: "Pension",
  CLIENT_ROLE: "Cliente",
};

const formatNacimiento = (value?: number) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

type ProjectOption = {
  id: string;
  name: string;
};

export function UniqueUserModal({
  open,
  user,
  isSubmitting = false,
  errorMessage = null,
  onEdit,
  onToggleStatus,
  onClose,
}: UniqueUserModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectsById, setProjectsById] = useState<Map<string, string>>(new Map());

  const roleLabel = useMemo(() => {
    return user ? ROLE_LABEL[user.rol] : "";
  }, [user]);

  const coordinatesLabel = useMemo(() => {
    if (!user?.coordinates.length) return "Sin coordenadas";
    return user.coordinates.join(", ");
  }, [user]);

  const assignedProjects = useMemo(() => {
    if (!user?.parkings?.length) return [];

    const items = user.parkings.map((projectId) => ({
      id: projectId,
      name: projectsById.get(projectId) ?? projectId,
    }));

    const q = projectSearch.trim().toLowerCase();
    if (!q) return items;

    return items.filter((project) => project.name.toLowerCase().includes(q));
  }, [projectSearch, projectsById, user?.parkings]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadProjects = async () => {
      try {
        const { data } = await api.get("/api/proyectos");
        const rawProjects: unknown[] = Array.isArray(data)
          ? data
          : (typeof data === "object" &&
            data !== null &&
            Array.isArray((data as { proyectos?: unknown[] }).proyectos)
              ? (data as { proyectos?: unknown[] }).proyectos ?? []
              : []);

        const mapped = rawProjects
          .map((project): ProjectOption | null => {
            if (typeof project !== "object" || project === null) return null;
            const record = project as Record<string, unknown>;
            const id = String(record.id ?? record.uid ?? record._id ?? "").trim();
            const name = String(record.nombre ?? record.name ?? "Proyecto").trim();

            if (!id) return null;
            return { id, name };
          })
          .filter((project): project is ProjectOption => project !== null);

        if (!cancelled) {
          setProjectsById(new Map(mapped.map((project) => [project.id, project.name])));
        }
      } catch {
        if (!cancelled) setProjectsById(new Map());
      }
    };

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleToggleState = async () => {
    if (!user) return;
    setLocalError(null);

    try {
      await onToggleStatus(user.id, !user.estado);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo cambiar el estado del acceso.";
      setLocalError(message);
      throw error;
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <UniqueModalBase
      open={open}
      title="Detalle de Acceso"
      entityName={user?.name || "Acceso"}
      className="unique-user-modal"
      isEntityActive={user?.estado}
      isSubmitting={isSubmitting}
      error={localError || errorMessage}
      onClose={onClose}
      onEditStart={() => {
        if (user) onEdit(user);
      }}
      onToggleStatus={handleToggleState}
      toggleStatusText={user?.estado ? "Desactivar" : "Activar"}
      toggleStatusIcon={user?.estado ? <FaUserSlash /> : <FaCheckCircle />}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaUserCheck className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion General</h3>
        </div>

        <section className="unique-user-modal__hero">
          {user?.img ? (
            <img
              src={user.img}
              alt={`Imagen de ${user.name}`}
              className="unique-user-modal__avatar"
            />
          ) : null}
          <div>
            <h4 className="unique-user-modal__name">{user?.name}</h4>
            <p className="unique-user-modal__status">
              <FaCircle className={user?.estado ? "is-active" : "is-inactive"} />
              {user?.estado ? "Activo" : "Inactivo"}
            </p>
          </div>
        </section>

        <div className="modal-section-grid">
          <article className="form-group unique-user-modal__item">
            <label>
              <FaUser />
              Nombre
            </label>
            <p className="unique-user-modal__value">{user?.nombre || "Sin nombre"}</p>
          </article>

          <article className="form-group unique-user-modal__item">
            <label>
              <FaUser />
              Apellido
            </label>
            <p className="unique-user-modal__value">{user?.apellido || "Sin apellido"}</p>
          </article>

          <article className="form-group modal-field-full unique-user-modal__item">
            <label>
              <FaEnvelope />
              Correo
            </label>
            <p className="unique-user-modal__value">{user?.correo}</p>
          </article>

          <article className="form-group unique-user-modal__item">
            <label>
              <FaPhone />
              Telefono
            </label>
            <p className="unique-user-modal__value">{user?.telefono || "Sin telefono"}</p>
          </article>

          <article className="form-group unique-user-modal__item">
            <label>
              <FaIdBadge />
              Rol
            </label>
            <p className="unique-user-modal__value">{roleLabel}</p>
          </article>

          <article className="form-group unique-user-modal__item">
            <label>
              <FaCalendarAlt />
              Nacimiento
            </label>
            <p className="unique-user-modal__value">{formatNacimiento(user?.nacimiento)}</p>
          </article>

          <article className="form-group unique-user-modal__item">
            <label>
              <FaMapMarkerAlt />
              Coordenadas
            </label>
            <p className="unique-user-modal__value">{coordinatesLabel}</p>
          </article>

          <article className="form-group modal-field-full unique-user-modal__item">
            <label>
              <FaBuilding />
              Proyectos asignados
            </label>
            <div className="unique-user-modal__projects-container">
              <div className="unique-user-modal__projects-search">
                <FaSearch />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(event) => setProjectSearch(event.target.value)}
                  placeholder="Buscar proyecto asignado..."
                />
              </div>
              <div className="unique-user-modal__projects-panel">
                {assignedProjects.length > 0 ? (
                  <ul className="unique-user-modal__projects-list">
                    {assignedProjects.map((project) => (
                      <li key={project.id} className="unique-user-modal__projects-item">
                        {project.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="unique-user-modal__projects-empty">
                    {user?.parkings?.length
                      ? "No hay proyectos que coincidan con la busqueda."
                      : "Sin proyectos asignados."}
                  </p>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>
    </UniqueModalBase>
  );
}
