import { FaLayerGroup } from "react-icons/fa";
import { CreateModalBase } from "../shared/modals/CreateModalBase";
import type { ModuloForm, ProyectoOption } from "../../types/modules/moduleForm.types";

type ModuleModalProps = {
  open: boolean;
  editing: boolean;
  form: ModuloForm;
  projects: ProyectoOption[];
  isSubmitting: boolean;
  error: string | null;
  setForm: (form: ModuloForm) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function ModuleModal({
  open,
  editing,
  form,
  projects,
  isSubmitting,
  error,
  setForm,
  onClose,
  onSubmit,
}: ModuleModalProps) {
  return (
    <CreateModalBase
      open={open}
      title={editing ? "Editar modulo" : "Crear modulo"}
      isSubmitting={isSubmitting}
      error={error}
      submitIcon={<FaLayerGroup />}
      submitText={editing ? "Guardar cambios" : "Guardar modulo"}
      successToastMessage={editing ? "Modulo actualizado" : "Modulo creado"}
      onClose={onClose}
      onSubmit={async () => {
        await onSubmit();
      }}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaLayerGroup className="modal-section-icon" />
          <h3 className="modal-section-title">Modulo</h3>
        </div>
        <div className="modal-section-grid">
          <div className="form-group">
            <label htmlFor="modulo-nombre">nombre <span className="required">*</span></label>
            <input
              id="modulo-nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm({ ...form, nombre: event.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="modulo-proyecto">proyecto <span className="required">*</span></label>
            <select
              id="modulo-proyecto"
              value={form.proyecto}
              onChange={(event) =>
                setForm({ ...form, proyecto: event.target.value })
              }
              required
              disabled
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="modulo-tipo">tipo <span className="required">*</span></label>
            <select
              id="modulo-tipo"
              value={form.tipo}
              onChange={(event) =>
                setForm({ ...form, tipo: event.target.value as ModuloForm["tipo"] })
              }
            >
              <option value="ENTRADA">ENTRADA</option>
              <option value="SALIDA">SALIDA</option>
              <option value="POS">POS</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="modulo-identificador">identificador <span className="required">*</span></label>
            <input
              id="modulo-identificador"
              value={form.identificador}
              onChange={(event) =>
                setForm({ ...form, identificador: event.target.value })
              }
              required
            />
          </div>
          <div className="form-group modal-field-full">
            <label htmlFor="modulo-descripcion">descripcion</label>
            <textarea
              id="modulo-descripcion"
              value={form.descripcion}
              onChange={(event) =>
                setForm({ ...form, descripcion: event.target.value })
              }
            />
          </div>
          {editing ? (
            <label className="admin-crud-switch modal-field-full">
              <span>estado</span>
              <input
                type="checkbox"
                checked={form.estado}
                onChange={(event) =>
                  setForm({ ...form, estado: event.target.checked })
                }
              />
            </label>
          ) : null}
        </div>
      </section>
    </CreateModalBase>
  );
}
