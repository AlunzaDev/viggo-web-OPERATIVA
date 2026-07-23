import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBuilding,
  FaChevronDown,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaLock,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { CreateModalBase } from "../../shared/modals/CreateModalBase";
import {
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_POLICY_REGEX,
} from "../../../../config/password-policy";
import {
  USER_MODULE_LABELS,
  getDefaultUserModules,
  type AppModuleAccess,
} from "../../../../domain/entities/module-access";
import type { PermissionProfileEntity } from "../../../../domain/entities/permission-profile.entity";
import type { UserEntity, UserRole } from "../../../../domain/entities/user.entity";
import { api } from "../../../../infrastructure/http/axios.instance";
import {
  ProjectPicker,
  type ParkingOption,
} from "../../shared/ProjectPicker/ProjectPicker";
import {
  BaseCombobox,
  type ComboOption,
} from "../../shared/BaseCombobox/BaseCombobox";
import "../../../styles/users/CreateUserModal.css";

export type CreateUserPayload = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password?: string;
  rol: UserRole;
  coordinates?: number[];
  nacimiento?: number;
  img?: string;
  estado?: boolean;
  google?: boolean;
  emailValidated?: boolean;
  parkings?: string[];
  permissionProfileId?: string;
  modules?: AppModuleAccess[];
};

type CreateUserModalProps = {
  open: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  mode?: "create" | "edit";
  initialValues?: UserEntity | null;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void> | void;
};

type PermissionProfileOption = PermissionProfileEntity;

type PermissionProfileResponseItem = {
  id?: unknown;
  _id?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  estado?: unknown;
  modules?: unknown;
};

const parseBooleanValue = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return defaultValue;
};

const mapPermissionProfile = (
  item: PermissionProfileResponseItem,
): PermissionProfileOption => ({
  id: String(item.id ?? item._id ?? "").trim(),
  nombre: String(item.nombre ?? "").trim(),
  descripcion:
    typeof item.descripcion === "string" && item.descripcion.trim().length > 0
      ? item.descripcion.trim()
      : undefined,
  estado: parseBooleanValue(item.estado, true),
  modules: Array.isArray(item.modules)
    ? item.modules
        .map((module) => String(module ?? "").trim())
        .filter((module): module is AppModuleAccess => module.length > 0)
    : getDefaultUserModules(),
});

const INITIAL_FORM: CreateUserPayload = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  password: "",
  rol: "CLIENT_ROLE",
  img: "",
  estado: true,
  google: false,
  emailValidated: false,
  parkings: [],
  permissionProfileId: undefined,
  modules: getDefaultUserModules(),
};

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "CLIENT_ROLE", label: "Cliente" },
  { value: "PENSION_ROLE", label: "Pension" },
  { value: "ADMIN_ROLE", label: "Administrador" },
  { value: "SUPER_ROLE", label: "Super Administrador" },
];

const mapUserToForm = (user?: UserEntity | null): CreateUserPayload => ({
  nombre: user?.nombre ?? "",
  apellido: user?.apellido ?? "",
  correo: user?.correo ?? "",
  telefono: user?.telefono ?? "",
  password: "",
  rol: user?.rol ?? "CLIENT_ROLE",
  coordinates: user?.coordinates ?? [],
  nacimiento: user?.nacimiento,
  img: user?.img ?? "",
  estado: user?.estado ?? true,
  google: user?.google ?? false,
  emailValidated: false,
  parkings: user?.parkings ?? [],
  permissionProfileId: user?.permissionProfileId,
  modules: user?.modules?.length ? user.modules : getDefaultUserModules(),
});

type ParkingResponseItem = {
  id?: unknown;
  uid?: unknown;
  _id?: unknown;
  name?: unknown;
  nombre?: unknown;
};

export function CreateUserModal({
  open,
  isSubmitting = false,
  errorMessage = null,
  mode = "create",
  initialValues = null,
  onClose,
  onSubmit,
}: CreateUserModalProps) {
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

  const [form, setForm] = useState<CreateUserPayload>(INITIAL_FORM);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRoleSelectOpen, setIsRoleSelectOpen] = useState(false);
  const [parkingOptions, setParkingOptions] = useState<ParkingOption[]>([]);
  const [permissionProfiles, setPermissionProfiles] = useState<
    PermissionProfileOption[]
  >([]);
  const [selectedParkingIds, setSelectedParkingIds] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<AppModuleAccess[]>(
    getDefaultUserModules(),
  );
  const roleSelectRef = useRef<HTMLDivElement | null>(null);

  const isEditMode = mode === "edit";
  const isSuperRole = form.rol === "SUPER_ROLE";

  const selectedRoleLabel = useMemo(
    () =>
      ROLE_OPTIONS.find((option) => option.value === form.rol)?.label ??
      "Seleccionar rol",
    [form.rol],
  );

  const selectedPermissionProfile = useMemo(
    () =>
      permissionProfiles.find(
        (profile) => profile.id === form.permissionProfileId,
      ) ?? null,
    [form.permissionProfileId, permissionProfiles],
  );

  const permissionProfileOptions = useMemo<ComboOption[]>(
    () =>
      permissionProfiles.map((profile) => ({
        id: profile.id,
        nombre: profile.nombre,
      })),
    [permissionProfiles],
  );

  const passwordValue = form.password?.trim() ?? "";
  const confirmPasswordValue = confirmPassword.trim();
  const passwordTouched = passwordValue.length > 0;
  const showPasswordMismatch =
    confirmPasswordValue.length > 0 &&
    passwordValue.length > 0 &&
    passwordValue !== confirmPasswordValue;
  const showPasswordPolicyError =
    passwordValue.length > 0 && !PASSWORD_POLICY_REGEX.test(passwordValue);

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

  useEffect(() => {
    if (!open) return;
    const nextForm = isEditMode ? mapUserToForm(initialValues) : INITIAL_FORM;
    setForm(nextForm);
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLocalError(null);
    setIsRoleSelectOpen(false);
    setSelectedParkingIds(isEditMode ? [...(initialValues?.parkings ?? [])] : []);
    setSelectedModules(nextForm.modules ?? getDefaultUserModules());
  }, [initialValues, isEditMode, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadCatalogs = async () => {
      try {
        const [projectsResponse, profilesResponse] = await Promise.all([
          api.get("/api/proyectos"),
          api.get("/api/permission-profiles"),
        ]);

        const parkingsRaw: unknown[] = Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : typeof projectsResponse.data === "object" &&
              projectsResponse.data !== null &&
              Array.isArray(
                (projectsResponse.data as { proyectos?: unknown[] }).proyectos,
              )
            ? (projectsResponse.data as { proyectos?: unknown[] }).proyectos ?? []
            : [];

        const mappedParkings = parkingsRaw
          .map((parking): ParkingOption => {
            const parsedParking =
              typeof parking === "object" && parking !== null
                ? (parking as ParkingResponseItem)
                : {};

            return {
              id: String(
                parsedParking.id ?? parsedParking.uid ?? parsedParking._id ?? "",
              ),
              name: String(
                parsedParking.name ?? parsedParking.nombre ?? "Proyecto",
              ),
            };
          })
          .filter((parking) => parking.id.trim().length > 0)
          .sort((a, b) => a.name.localeCompare(b.name, "es"));

        const rawProfiles = Array.isArray(profilesResponse.data)
          ? profilesResponse.data
          : typeof profilesResponse.data === "object" &&
              profilesResponse.data !== null &&
              Array.isArray(
                (profilesResponse.data as { profiles?: unknown[] }).profiles,
              )
            ? (profilesResponse.data as { profiles?: unknown[] }).profiles ?? []
            : [];

        const mappedProfiles = rawProfiles
          .map((item) =>
            mapPermissionProfile(
              typeof item === "object" && item !== null
                ? (item as PermissionProfileResponseItem)
                : {},
            ),
          )
          .filter((profile) => profile.id.length > 0 && profile.estado);

        if (cancelled) return;

        setParkingOptions(mappedParkings);
        setPermissionProfiles(mappedProfiles);
      } catch {
        if (cancelled) return;
        setParkingOptions([]);
        setPermissionProfiles([]);
      }
    };

    void loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!form.permissionProfileId) return;
    const profile = permissionProfiles.find(
      (item) => item.id === form.permissionProfileId,
    );
    if (!profile) return;
    setSelectedModules(profile.modules);
  }, [form.permissionProfileId, permissionProfiles]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isSubmitting) return;
      if (isRoleSelectOpen) {
        setIsRoleSelectOpen(false);
        return;
      }
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, isSubmitting, isRoleSelectOpen]);

  useEffect(() => {
    if (!open || !isRoleSelectOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!roleSelectRef.current?.contains(event.target as Node)) {
        setIsRoleSelectOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, isRoleSelectOpen]);

  useEffect(() => {
    if (isSuperRole) return;
    if (selectedParkingIds.length <= 1) return;
    setSelectedParkingIds((prev) => prev.slice(0, 1));
  }, [isSuperRole, selectedParkingIds]);

  const requiresPassword = !isEditMode;

  const toggleParkingSelection = (id: string) => {
    setSelectedParkingIds((prev) => {
      if (isSuperRole) {
        return prev.includes(id)
          ? prev.filter((item) => item !== id)
          : [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  };

  const selectAllParkings = () => {
    setSelectedParkingIds(parkingOptions.map((parking) => parking.id));
  };

  const clearParkingSelection = () => {
    setSelectedParkingIds([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (
      !form.nombre.trim() ||
      !form.apellido.trim() ||
      !form.correo.trim() ||
      !form.telefono.trim()
    ) {
      showValidationToast("Completa nombre, apellido, correo y telefono.");
      return false;
    }

    if (!form.permissionProfileId?.trim()) {
      showValidationToast("Selecciona un perfil de permisos.");
      return false;
    }

    if (requiresPassword && !PASSWORD_POLICY_REGEX.test(passwordValue)) {
      showValidationToast(PASSWORD_POLICY_MESSAGE);
      return false;
    }

    if (
      isEditMode &&
      passwordTouched &&
      !PASSWORD_POLICY_REGEX.test(passwordValue)
    ) {
      showValidationToast(PASSWORD_POLICY_MESSAGE);
      return false;
    }

    if (
      (requiresPassword || passwordTouched) &&
      passwordValue !== confirmPasswordValue
    ) {
      showValidationToast("Las contrasenas no coinciden.");
      return false;
    }

    const payload: CreateUserPayload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      correo: form.correo.trim().toLowerCase(),
      telefono: form.telefono.trim(),
      rol: form.rol,
      img: form.img?.trim() || undefined,
      google: form.google === true,
      parkings: selectedParkingIds,
      permissionProfileId: form.permissionProfileId,
      modules: selectedModules,
    };

    if (isEditMode) {
      payload.estado = form.estado !== false;
    } else {
      payload.estado = form.estado !== false;
      payload.emailValidated = form.emailValidated === true;
    }

    if (form.coordinates?.length) payload.coordinates = form.coordinates;
    if (typeof form.nacimiento === "number") payload.nacimiento = form.nacimiento;
    if (passwordValue.length > 0) payload.password = passwordValue;

    await onSubmit(payload);
    return true;
  };

  if (typeof window === "undefined") return null;

  return (
    <CreateModalBase
      open={open}
      title={isEditMode ? "Editar Acceso" : "Crear Nuevo Acceso"}
      isSubmitting={isSubmitting}
      error={localError || errorMessage}
      className="create-user-modal"
      submitText={isEditMode ? "Guardar Cambios" : "Guardar Acceso"}
      submitIcon={isEditMode ? <FaEdit /> : <FaUserPlus />}
      successToastMessage={
        isEditMode
          ? "Acceso actualizado exitosamente"
          : "Acceso creado exitosamente"
      }
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaUser className="modal-section-icon" />
          <h3 className="modal-section-title">Informacion Personal</h3>
        </div>

        <div className="modal-section-grid">
          <div className="form-group modal-field-full">
            <label htmlFor="create-user-img-file">Imagen</label>
            <label
              className="create-user-modal__image-drop"
              htmlFor="create-user-img-file"
            >
              <input
                id="create-user-img-file"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={isSubmitting}
              />
              {form.img ? (
                <img src={form.img} alt="Vista previa del acceso" />
              ) : (
                <span className="create-user-modal__image-empty">
                  <FaImage aria-hidden="true" />
                  <span>Seleccionar imagen</span>
                </span>
              )}
            </label>
            {form.img ? (
              <button
                type="button"
                className="create-user-modal__image-clear"
                onClick={() => setForm((prev) => ({ ...prev, img: "" }))}
                disabled={isSubmitting}
              >
                Quitar imagen
              </button>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="create-user-nombre">
              Nombre <span className="required">*</span>
            </label>
            <input
              id="create-user-nombre"
              type="text"
              value={form.nombre}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nombre: event.target.value }))
              }
              placeholder="Nombre"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="create-user-apellido">
              Apellido <span className="required">*</span>
            </label>
            <input
              id="create-user-apellido"
              type="text"
              value={form.apellido}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, apellido: event.target.value }))
              }
              placeholder="Apellido"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="create-user-correo">
              Correo <span className="required">*</span>
            </label>
            <input
              id="create-user-correo"
              type="email"
              value={form.correo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, correo: event.target.value }))
              }
              placeholder="usuario@viggo.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="create-user-telefono">
              Telefono <span className="required">*</span>
            </label>
            <input
              id="create-user-telefono"
              type="tel"
              value={form.telefono}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, telefono: event.target.value }))
              }
              placeholder="5550000000"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="create-user-password">
              Contrasena {requiresPassword ? <span className="required">*</span> : null}
            </label>
            <div className="create-user-modal__password-wrap">
              <FaLock className="create-user-modal__inner-icon" />
              <input
                id="create-user-password"
                className="has-inner-icon"
                type={showPassword ? "text" : "password"}
                value={form.password ?? ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={isEditMode ? "Deja vacio para no cambiarla" : "********"}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="create-user-modal__password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <small className="create-user-modal__password-rule">
              Minimo 8 caracteres, con 1 mayuscula, 1 minuscula y 1 numero.
            </small>
            {showPasswordPolicyError ? (
              <p className="create-user-modal__field-error">
                {PASSWORD_POLICY_MESSAGE}
              </p>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="create-user-password-confirm">
              Confirmar Contrasena {requiresPassword ? <span className="required">*</span> : null}
            </label>
            <div className="create-user-modal__password-wrap">
              <FaLock className="create-user-modal__inner-icon" />
              <input
                id="create-user-password-confirm"
                className="has-inner-icon"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={isEditMode ? "Solo si cambias la contrasena" : "********"}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="create-user-modal__password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isSubmitting}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmacion de contrasena"
                    : "Mostrar confirmacion de contrasena"
                }
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {showPasswordMismatch ? (
              <p className="create-user-modal__field-error">
                Las contrasenas no coinciden.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="modal-form-section">
        <div className="modal-section-header">
          <FaBuilding className="modal-section-icon" />
          <h3 className="modal-section-title">Acceso y Alcance</h3>
        </div>

        <div className="modal-section-grid">
          <div className="form-group modal-field-full">
            <label htmlFor="create-user-role">
              Rol <span className="required">*</span>
            </label>
            <div className="create-user-modal__select" ref={roleSelectRef}>
              <button
                id="create-user-role"
                type="button"
                className="create-user-modal__select-trigger"
                aria-haspopup="listbox"
                aria-expanded={isRoleSelectOpen}
                aria-controls="create-user-role-listbox"
                disabled={isSubmitting}
                onClick={() => setIsRoleSelectOpen((prev) => !prev)}
              >
                <span>{selectedRoleLabel}</span>
                <FaChevronDown
                  className={`create-user-modal__select-icon${
                    isRoleSelectOpen ? " is-open" : ""
                  }`}
                />
              </button>

              {isRoleSelectOpen ? (
                <ul
                  id="create-user-role-listbox"
                  role="listbox"
                  className="create-user-modal__select-menu"
                  aria-labelledby="create-user-role"
                >
                  {ROLE_OPTIONS.map((option) => {
                    const isSelected = option.value === form.rol;

                    return (
                      <li key={option.value} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          className={`create-user-modal__select-option${
                            isSelected ? " is-selected" : ""
                          }`}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, rol: option.value }));
                            setIsRoleSelectOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="modal-field-full create-user-modal__access-card create-user-modal__access-card--project-picker">
            <ProjectPicker
              options={parkingOptions}
              selectedIds={selectedParkingIds}
              onToggle={toggleParkingSelection}
              onSelectAll={isSuperRole ? selectAllParkings : undefined}
              onClearSelection={clearParkingSelection}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group modal-field-full create-user-modal__access-card">
            <div className="create-user-modal__profile-header">
              <div>
                <label htmlFor="create-user-permission-profile">
                  Perfil de permisos <span className="required">*</span>
                </label>
                <p className="create-user-modal__modules-help">
                  El acceso hereda automaticamente los modulos definidos por este perfil.
                </p>
              </div>
            </div>

            <div className="create-user-modal__profile-combobox">
              <BaseCombobox
                placeholder="Buscar perfil"
                allLabel="Selecciona un perfil"
                iconTitle="Seleccionar perfil"
                options={permissionProfileOptions}
                value={form.permissionProfileId}
                onChange={(id) =>
                  setForm((prev) => ({
                    ...prev,
                    permissionProfileId: id,
                  }))
                }
                renderInPortal
                showAllOption={false}
              />
            </div>

            <div className="create-user-modal__profile-preview">
              <div className="create-user-modal__profile-preview-copy">
                <strong>
                  {selectedPermissionProfile?.nombre ?? "Sin perfil seleccionado"}
                </strong>
                <small>
                  {selectedPermissionProfile?.descripcion ??
                    "Selecciona un perfil para ver que modulos heredara este usuario."}
                </small>
              </div>

              <div className="create-user-modal__profile-pills">
                {(selectedModules.length > 0
                  ? selectedModules
                  : getDefaultUserModules()
                ).map((module) => (
                  <span key={module} className="create-user-modal__profile-pill">
                    {USER_MODULE_LABELS[module]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {isEditMode ? (
            <label
              className={`create-user-modal__mail-option ${
                form.estado !== false ? "is-checked" : ""
              }`}
            >
              <span className="create-user-modal__mail-option-icon">
                <FaUser />
              </span>
              <span className="create-user-modal__mail-option-copy">
                <strong>Cuenta activa</strong>
                <small>Se enviara al backend como estado.</small>
              </span>
              <input
                type="checkbox"
                checked={form.estado !== false}
                disabled={isSubmitting}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, estado: event.target.checked }))
                }
              />
              <span className="create-user-modal__mail-switch" aria-hidden="true">
                <span />
              </span>
            </label>
          ) : null}

          {!isEditMode ? (
            <label
              className={`create-user-modal__mail-option ${
                form.emailValidated === true ? "is-checked" : ""
              }`}
            >
              <span className="create-user-modal__mail-option-icon">
                <FaUserPlus />
              </span>
              <span className="create-user-modal__mail-option-copy">
                <strong>Correo validado</strong>
                <small>Permite iniciar sesion sin validacion por correo.</small>
              </span>
              <input
                type="checkbox"
                checked={form.emailValidated === true}
                disabled={isSubmitting}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    emailValidated: event.target.checked,
                  }))
                }
              />
              <span className="create-user-modal__mail-switch" aria-hidden="true">
                <span />
              </span>
            </label>
          ) : null}
        </div>
      </section>
    </CreateModalBase>
  );
}
