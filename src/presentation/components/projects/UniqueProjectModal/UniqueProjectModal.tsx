import { FaAlignLeft, FaBuilding, FaCity, FaHashtag, FaImage, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
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
  onDelete?: (id: string) => Promise<void> | void;
  onClose: () => void;
};

export function UniqueProjectModal({
  open,
  project,
  isSubmitting = false,
  errorMessage = null,
  onEdit,
  onDelete,
  onClose,
}: UniqueProjectModalProps) {
  const handleDeleteProject = async () => {
    if (!project || !onDelete) return;

    const result = await Swal.fire({
      title: "Eliminar proyecto",
      text: `Estas seguro de eliminar "${project.nombre}"? Esta accion no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
      background: "transparent",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
      },
    });

    if (!result.isConfirmed) return;

    await onDelete(project.id);
    onClose();

    void Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: "Proyecto eliminado",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  if (typeof window === "undefined") return null;

  return (
    <UniqueModalBase
      open={open}
      title="Detalle del Proyecto"
      entityName={project?.nombre || "Proyecto"}
      className="unique-project-modal"
      isSubmitting={isSubmitting}
      error={errorMessage}
      onClose={onClose}
      onEditStart={() => {
        if (project) onEdit(project);
      }}
      extraActions={
        onDelete ? (
          <button
            type="button"
            className="btn-form-secondary btn-form-danger"
            onClick={handleDeleteProject}
            disabled={isSubmitting}
          >
            <FaTrash />
            <span>Eliminar</span>
          </button>
        ) : null
      }
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaBuilding className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion general</h3>
        </div>

        <div className="unique-project-modal__hero">
          <div className="unique-project-modal__hero-icon">
            <FaBuilding />
          </div>
          <div className="unique-project-modal__hero-info">
            <h4 className="unique-project-modal__hero-name">{project?.nombre}</h4>
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
            <p className="unique-project-modal__value">
              {project?.img || <span className="unique-project-modal__value--muted">Sin imagen</span>}
            </p>
          </article>
        </div>
      </section>
    </UniqueModalBase>
  );
}
