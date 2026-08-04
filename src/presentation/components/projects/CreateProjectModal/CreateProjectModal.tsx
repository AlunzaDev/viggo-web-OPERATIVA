import { useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaImage, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import type { ParkingEntity } from "../../../../domain/entities/parking.entity";
import {
  MEXICO_CITIES_BY_STATE,
  MEXICO_STATES,
  type MexicoCityOption,
  type MexicoStateOption,
} from "../../../data/mexico-location-catalog";
import { CreateModalBase } from "../../shared/modals/CreateModalBase";
import type { ProjectFormPayload } from "../../../hooks/parkings/useParkings";
import "../../../styles/projects/CreateProjectModal.css";

export type CreateProjectPayload = ProjectFormPayload;

type CreateProjectFormState = {
  nombre: string;
  ciudad: string;
  estadoCiudad: string;
  ciudadOtro: string;
  identificador: string;
  coordinates: [number, number];
  descripcion: string;
  img: string;
  estado: boolean;
};

type CreateProjectModalProps = {
  open: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  mode?: "create" | "edit";
  initialValues?: ParkingEntity | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void> | void;
};

const INITIAL_FORM: CreateProjectFormState = {
  nombre: "",
  ciudad: "",
  estadoCiudad: "",
  ciudadOtro: "",
  identificador: "",
  coordinates: [0, 0],
  descripcion: "",
  img: "",
  estado: true,
};

const OTHER_CITY_VALUE = "__other__";

const findStateByCity = (
  cityName: string,
  states: MexicoStateOption[],
  citiesByState: Record<string, MexicoCityOption[]>,
) => {
  const normalizedCity = cityName.trim().toLowerCase();
  if (!normalizedCity) return null;

  for (const state of states) {
    const city = (citiesByState[state.isoCode] ?? []).find(
      (item) => item.name.trim().toLowerCase() === normalizedCity
    );

    if (city) {
      return { stateCode: state.isoCode, cityName: city.name };
    }
  }

  return null;
};

const mapProjectToForm = (
  project?: ParkingEntity | null,
  states: MexicoStateOption[] = [],
  citiesByState: Record<string, MexicoCityOption[]> = {},
): CreateProjectFormState => {
  if (!project) return INITIAL_FORM;
  const matchedLocation = findStateByCity(project.ciudad, states, citiesByState);

  return {
    nombre: project.nombre,
    ciudad: matchedLocation?.cityName ?? OTHER_CITY_VALUE,
    estadoCiudad: matchedLocation?.stateCode ?? "",
    ciudadOtro: matchedLocation ? "" : project.ciudad,
    identificador: project.identificador,
    coordinates: [project.longitude, project.latitude],
    descripcion: project.descripcion,
    img: project.img,
    estado: project.estado,
  };
};

export function CreateProjectModal({
  open,
  isSubmitting = false,
  errorMessage = null,
  mode = "create",
  initialValues = null,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const [form, setForm] = useState<CreateProjectFormState>(INITIAL_FORM);
  const [localError, setLocalError] = useState<string | null>(null);
  const isEditMode = mode === "edit";
  const cityOptions = useMemo(() => {
    if (!form.estadoCiudad) return [];
    return MEXICO_CITIES_BY_STATE[form.estadoCiudad] ?? [];
  }, [form.estadoCiudad]);
  const selectedCity = form.ciudad === OTHER_CITY_VALUE ? form.ciudadOtro.trim() : form.ciudad.trim();

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setForm(mapProjectToForm(initialValues, MEXICO_STATES, MEXICO_CITIES_BY_STATE));
  }, [initialValues, open]);

  const canSubmit = useMemo(() => {
    return (
      form.nombre.trim().length > 0 &&
      selectedCity.length > 0 &&
      form.identificador.trim().length > 0
    );
  }, [form.identificador, form.nombre, selectedCity]);

  const showValidationToast = (message: string) => {
    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: "warning",
      title: "Revisa el formulario",
      text: message,
      showConfirmButton: false,
      timer: 2800,
      timerProgressBar: true,
    });
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showValidationToast("Selecciona un archivo de imagen valido.");
      event.target.value = "";
      return;
    }

    const maxSizeInBytes = 1_500_000;
    if (file.size > maxSizeInBytes) {
      showValidationToast("La imagen debe pesar menos de 1.5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, img: reader.result as string }));
      }
    };
    reader.onerror = () => {
      showValidationToast("No se pudo cargar la imagen.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!canSubmit) {
      showValidationToast("Completa nombre, ciudad e identificador.");
      return false;
    }

    await onSubmit({
      nombre: form.nombre.trim(),
      ciudad: selectedCity,
      identificador: form.identificador.trim(),
      coordinates: form.coordinates,
      descripcion: form.descripcion.trim(),
      img: form.img.trim(),
      estado: form.estado,
    });
    return true;
  };

  if (typeof window === "undefined") return null;

  return (
    <CreateModalBase
      open={open}
      title={isEditMode ? "Editar proyecto" : "Crear nuevo proyecto"}
      isSubmitting={isSubmitting}
      error={localError || errorMessage}
      className="create-project-modal"
      submitText={isEditMode ? "Guardar cambios" : "Guardar proyecto"}
      submitIcon={isEditMode ? <FaEdit /> : <FaPlus />}
      successToastMessage={isEditMode ? "Proyecto actualizado correctamente" : "Proyecto creado correctamente"}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaBuilding className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion del proyecto</h3>
        </div>

        <div className="modal-section-grid">
          <div className="form-group modal-field-full">
            <label htmlFor="create-project-image-file">Imagen</label>
            <label className="create-project-modal__image-drop" htmlFor="create-project-image-file">
              <input
                id="create-project-image-file"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={isSubmitting}
              />
              {form.img ? (
                <img src={form.img} alt="Vista previa del proyecto" />
              ) : (
                <span className="create-project-modal__image-empty">
                  <FaImage aria-hidden="true" />
                  <span>Seleccionar imagen</span>
                </span>
              )}
            </label>
            {form.img ? (
              <button
                type="button"
                className="create-project-modal__image-clear"
                onClick={() => setForm((prev) => ({ ...prev, img: "" }))}
                disabled={isSubmitting}
              >
                Quitar imagen
              </button>
            ) : null}
          </div>

          <div className="form-group modal-field-full">
            <label htmlFor="create-project-name">
              Nombre <span className="required">*</span>
            </label>
            <input
              id="create-project-name"
              type="text"
              value={form.nombre}
              onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
              placeholder="Ej. Viggo Centro"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="create-project-state">
              Estado
            </label>
            <select
              id="create-project-state"
              value={form.estadoCiudad}
              onChange={(event) => {
                setForm((prev) => ({
                  ...prev,
                  estadoCiudad: event.target.value,
                  ciudad: "",
                  ciudadOtro: "",
                }));
              }}
              disabled={isSubmitting}
            >
              <option value="">Seleccionar estado</option>
              {MEXICO_STATES.map((state) => (
                <option key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="create-project-city">
              Ciudad <span className="required">*</span>
            </label>
            <select
              id="create-project-city"
              value={form.ciudad}
              onChange={(event) => setForm((prev) => ({ ...prev, ciudad: event.target.value, ciudadOtro: "" }))}
              disabled={isSubmitting}
            >
              <option value="">Seleccionar ciudad</option>
              {(cityOptions as MexicoCityOption[]).map((city) => (
                <option key={`${city.name}-${city.latitude}-${city.longitude}`} value={city.name}>
                  {city.name}
                </option>
              ))}
              <option value={OTHER_CITY_VALUE}>Otro</option>
            </select>
          </div>

          {form.ciudad === OTHER_CITY_VALUE ? (
            <div className="form-group modal-field-full">
              <label htmlFor="create-project-city-other">
                Otra ciudad <span className="required">*</span>
              </label>
              <input
                id="create-project-city-other"
                type="text"
                value={form.ciudadOtro}
                onChange={(event) => setForm((prev) => ({ ...prev, ciudadOtro: event.target.value }))}
                placeholder="Escribe la ciudad"
                disabled={isSubmitting}
              />
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="create-project-identifier">
              Identificador <span className="required">*</span>
            </label>
            <input
              id="create-project-identifier"
              type="text"
              value={form.identificador}
              onChange={(event) => setForm((prev) => ({ ...prev, identificador: event.target.value }))}
              placeholder="Ej. VIGGO-CDMX-01"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group modal-field-full">
            <label htmlFor="create-project-description">Descripcion</label>
            <input
              id="create-project-description"
              type="text"
              value={form.descripcion}
              onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
              placeholder="Descripcion corta del proyecto"
              disabled={isSubmitting}
            />
          </div>

          {isEditMode ? (
            <label className={`create-project-modal__state-toggle ${form.estado ? "is-checked" : ""}`}>
              <span className="create-project-modal__state-copy">
                <strong>Proyecto activo</strong>
                <small>Se enviara al backend como estado.</small>
              </span>
              <input
                type="checkbox"
                checked={form.estado}
                disabled={isSubmitting}
                onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.checked }))}
              />
              <span className="create-project-modal__state-switch" aria-hidden="true">
                <span />
              </span>
            </label>
          ) : null}
        </div>
      </section>
    </CreateModalBase>
  );
}
