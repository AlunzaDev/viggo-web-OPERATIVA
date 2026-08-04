import { FaAlignLeft, FaBuilding, FaCity, FaHashtag, FaImage, FaPowerOff } from "react-icons/fa";
import type { ParkingEntity } from "../../../../domain/entities/parking.entity";
import { CopyableId } from "../../shared/CopyableId";
import { UniqueModalBase } from "../../shared/modals/UniqueModalBase";
import "../../../styles/projects/UniqueProjectModal.css";

type UniqueProjectModalProps = {
  open: boolean;
  project: ParkingEntity | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onEdit: (project: ParkingEntity) => void;
  onToggleStatus?: (project: ParkingEntity) => Promise<void> | void;
  onClose: () => void;
};

const getProjectInitials = (project: ParkingEntity | null) => {
  if (!project) return "P";

  const source = project.nombre.trim() || project.identificador.trim() || "P";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export function UniqueProjectModal({
  open,
  project,
  isSubmitting = false,
  errorMessage = null,
  onEdit,
  onToggleStatus,
  onClose,
}: UniqueProjectModalProps) {
  const projectInitials = getProjectInitials(project);

  if (typeof window === "undefined") return null;

  return (
    <UniqueModalBase
      open={open}
      title="Detalle del Proyecto"
      entityName={project?.nombre || "Proyecto"}
      className="unique-project-modal"
      isSubmitting={isSubmitting}
      error={errorMessage}
      isEntityActive={project?.estado ?? false}
      onClose={onClose}
      onEditStart={() => {
        if (project) onEdit(project);
      }}
      onToggleStatus={() => {
        if (!project || !onToggleStatus) return Promise.resolve();
        return onToggleStatus(project);
      }}
      toggleStatusText={project?.estado ? "Desactivar" : "Activar"}
      toggleStatusIcon={<FaPowerOff />}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaBuilding className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion general</h3>
        </div>

        <div className="unique-project-modal__hero shared-modal-hero">
          <div className="unique-project-modal__hero-media">
            {project?.img ? (
              <img
                src={project.img}
                alt={`Imagen de ${project.nombre}`}
                className="unique-project-modal__hero-image"
                onError={(event) => {
                  const image = event.currentTarget;
                  if (image.dataset.fallbackApplied === "true") return;
                  image.dataset.fallbackApplied = "true";
                  image.style.display = "none";
                  image.nextElementSibling?.removeAttribute("hidden");
                }}
              />
            ) : null}
            <span
              className="unique-project-modal__hero-fallback shared-modal-hero__badge"
              aria-hidden="true"
              hidden={Boolean(project?.img)}
            >
              {projectInitials}
            </span>
          </div>
          <div className="unique-project-modal__hero-info shared-modal-hero__copy">
            <h4 className="unique-project-modal__hero-name shared-modal-hero__title">{project?.nombre}</h4>
            <p className="unique-project-modal__hero-subtitle shared-modal-hero__meta">
              {project?.identificador || "Sin identificador"}
            </p>
            {project ? (
              <div className="unique-project-modal__hero-id">
                <CopyableId value={project.id} copyLabel={`Copiar ID de ${project.nombre}`} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="modal-section-grid">
          <article className="form-group modal-field-full unique-project-modal__item">
            <label>
              <FaHashtag /> Identificador
            </label>
            <p className="unique-project-modal__value">{project?.identificador}</p>
          </article>

          <article className="form-group unique-project-modal__item">
            <label>
              <FaCity /> Ciudad
            </label>
            <p className="unique-project-modal__value">{project?.ciudad}</p>
          </article>

          <article className="form-group unique-project-modal__item">
            <label>Estado</label>
            <p className="unique-project-modal__value">{project?.estado ? "Activo" : "Inactivo"}</p>
          </article>

          <article className="form-group modal-field-full unique-project-modal__item">
            <label>
              <FaAlignLeft /> Descripcion
            </label>
            <p className="unique-project-modal__value unique-project-modal__value--desc">
              {project?.descripcion || (
                <span className="unique-project-modal__value--muted">Sin descripcion</span>
              )}
            </p>
          </article>

          <article className="form-group modal-field-full unique-project-modal__item">
            <label>
              <FaImage /> Imagen
            </label>
            <div className="unique-project-modal__image-panel">
              {project?.img ? (
                <img
                  src={project.img}
                  alt={`Imagen de ${project.nombre}`}
                  className="unique-project-modal__image-preview"
                />
              ) : (
                <div className="unique-project-modal__image-empty">
                  <FaImage aria-hidden="true" />
                  <span>Sin imagen</span>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </UniqueModalBase>
  );
}
