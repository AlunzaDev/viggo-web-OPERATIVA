import { useMemo, useState } from "react";
import { FaEdit, FaIdBadge, FaInfoCircle, FaPlus, FaPowerOff, FaShieldAlt } from "react-icons/fa";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { PageHeader } from "../../components/shared/PageHeader";
import { CreateModalBase } from "../../components/shared/modals/CreateModalBase";
import { UniqueModalBase } from "../../components/shared/modals/UniqueModalBase";
import {
  AVAILABLE_USER_MODULES,
  USER_MODULE_LABELS,
  type AppModuleAccess,
} from "../../../domain/entities/module-access";
import type { PermissionProfileEntity } from "../../../domain/entities/permission-profile.entity";
import { usePermissionProfiles } from "../../hooks/permissionProfiles/usePermissionProfiles";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import "../../styles/permissionProfiles/PermissionProfilesPage.css";

type ProfileFormState = {
  nombre: string;
  descripcion: string;
  estado: boolean;
  modules: AppModuleAccess[];
};

const INITIAL_FORM: ProfileFormState = {
  nombre: "",
  descripcion: "",
  estado: true,
  modules: [],
};

const getProfileInitials = (profile?: Pick<PermissionProfileEntity, "nombre"> | null) => {
  const source = profile?.nombre?.trim() || "PP";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const mapProfileToForm = (profile?: PermissionProfileEntity | null): ProfileFormState => ({
  nombre: profile?.nombre ?? "",
  descripcion: profile?.descripcion ?? "",
  estado: profile?.estado ?? true,
  modules: profile?.modules ?? [],
});

export function PermissionProfilesPage() {
  usePageTitle("Perfiles");

  const {
    profiles,
    isLoading,
    isSaving,
    isUpdating,
    error,
    createProfile,
    updateProfile,
  } = usePermissionProfiles();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PermissionProfileEntity | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PermissionProfileEntity | null>(null);
  const [form, setForm] = useState<ProfileFormState>(INITIAL_FORM);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      if (!query) return true;
      return (
        profile.nombre.toLowerCase().includes(query) ||
        (profile.descripcion ?? "").toLowerCase().includes(query)
      );
    });
  }, [profiles, search]);

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setSelectedProfile(null);
    setIsCreateOpen(true);
  };

  const openEdit = (profile: PermissionProfileEntity) => {
    setEditingProfile(profile);
    setForm(mapProfileToForm(profile));
  };

  const closeModal = () => {
    if (isSaving || isUpdating) return;
    setIsCreateOpen(false);
    setEditingProfile(null);
    setForm(INITIAL_FORM);
  };

  const closeDetail = () => {
    setSelectedProfile(null);
  };

  const toggleModule = (module: AppModuleAccess) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter((item) => item !== module)
        : [...prev.modules, module],
    }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      throw new Error("El nombre del perfil es obligatorio.");
    }
    if (form.modules.length === 0) {
      throw new Error("Selecciona al menos un modulo.");
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      estado: form.estado,
      modules: form.modules,
    };

    if (editingProfile) {
      await updateProfile(editingProfile.id, payload);
      setSelectedProfile((current) =>
        current?.id === editingProfile.id
          ? {
              ...editingProfile,
              ...payload,
            }
          : current,
      );
      setEditingProfile(null);
    } else {
      await createProfile(payload);
      setIsCreateOpen(false);
    }

    setForm(INITIAL_FORM);
  };

  const handleToggleProfileState = async (profile: PermissionProfileEntity) => {
    const updated = await updateProfile(profile.id, {
      estado: !profile.estado,
    });
    setSelectedProfile((current) => (current?.id === profile.id ? updated : current));
  };

  return (
    <div className="permission-profiles-page">
      <PageHeader
        title="Perfiles de permisos"
        subtitle="Define paquetes de modulos para asignarlos rapido a los accesos."
        meta={
          <span className="permission-profiles-page__meta">
            {profiles.length === 1 ? "1 perfil" : `${profiles.length} perfiles`}
          </span>
        }
        error={error}
      />

      <CrudActionsIsland
        className="permission-profiles-page__island"
        searchValue={search}
        onSearchChange={(event) => setSearch(event.target.value)}
        onSearchClear={() => setSearch("")}
        searchPlaceholder="Buscar perfil"
        showCreate
        createIcon={<FaPlus />}
        createLabel="Crear perfil"
        onCreate={openCreate}
      />

      {isLoading ? (
        <div className="permission-profiles-page__state">Cargando perfiles...</div>
      ) : filteredProfiles.length === 0 ? (
        <div className="permission-profiles-page__state">
          No hay perfiles de permisos registrados.
        </div>
      ) : (
        <div className="permission-profiles-page__grid">
          {filteredProfiles.map((profile) => (
            <article
              key={profile.id}
              className={`permission-profiles-page__card${
                selectedProfile?.id === profile.id ? " is-selected" : ""
              }`}
            >
              <div className="permission-profiles-page__card-header">
                <div className="shared-identity permission-profiles-page__card-identity">
                  <span className="shared-identity__badge permission-profiles-page__card-badge">
                    {getProfileInitials(profile)}
                  </span>
                  <div className="shared-identity__copy permission-profiles-page__card-copy">
                    <h3>{profile.nombre}</h3>
                    <p>{profile.descripcion ?? "Sin descripcion."}</p>
                  </div>
                </div>
                <span
                  className={`permission-profiles-page__status ${
                    profile.estado ? "is-active" : "is-inactive"
                  }`}
                >
                  {profile.estado ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="permission-profiles-page__modules">
                {profile.modules.map((module) => (
                  <span key={module} className="permission-profiles-page__module-chip">
                    {USER_MODULE_LABELS[module]}
                  </span>
                ))}
              </div>

              <div className="permission-profiles-page__card-actions">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedProfile(profile);
                  }}
                >
                  <FaInfoCircle />
                  <span>Detalle</span>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEdit(profile);
                  }}
                >
                  <FaEdit />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  className={profile.estado ? "is-warning" : ""}
                  disabled={isUpdating}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleToggleProfileState(profile);
                  }}
                >
                  <FaPowerOff />
                  <span>{profile.estado ? "Desactivar" : "Activar"}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CreateModalBase
        open={isCreateOpen || Boolean(editingProfile)}
        title={editingProfile ? "Editar perfil" : "Crear perfil"}
        isSubmitting={isSaving || isUpdating}
        error={error}
        submitText={editingProfile ? "Guardar cambios" : "Crear perfil"}
        onClose={closeModal}
        onSubmit={async (event) => {
          event.preventDefault();
          await handleSubmit();
          return true;
        }}
      >
        <div className="permission-profiles-page__modal">
          <section className="modal-form-section">
            <div className="modal-section-header">
              <FaIdBadge className="modal-section-icon" />
              <h3 className="modal-section-title">Datos del Perfil</h3>
            </div>

            <div className="shared-modal-intro permission-profiles-page__modal-intro">
              <span className="shared-modal-intro__badge permission-profiles-page__modal-badge">
                {getProfileInitials(editingProfile)}
              </span>
              <div className="shared-modal-intro__copy permission-profiles-page__modal-copy">
                <strong>{editingProfile ? "Ajusta este perfil" : "Nuevo perfil de permisos"}</strong>
                <span>
                  {form.modules.length} modulo{form.modules.length === 1 ? "" : "s"} seleccionado{form.modules.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="modal-section-grid">
              <div className="form-group modal-field-full">
                <label htmlFor="permission-profile-name">Nombre</label>
                <input
                  id="permission-profile-name"
                  type="text"
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, nombre: event.target.value }))
                  }
                  placeholder="Ej. Cajero nocturno"
                />
              </div>

              <div className="form-group modal-field-full">
                <label htmlFor="permission-profile-description">Descripcion</label>
                <textarea
                  id="permission-profile-description"
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, descripcion: event.target.value }))
                  }
                  rows={3}
                  placeholder="Describe para que tipo de acceso sirve este perfil."
                />
              </div>

              <label className="permission-profiles-page__toggle permission-profiles-page__toggle-card modal-field-full">
                <input
                  type="checkbox"
                  checked={form.estado}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, estado: event.target.checked }))
                  }
                />
                <span>
                  <strong>Perfil activo</strong>
                  <small>Si lo apagas ya no deberia asignarse a nuevos accesos.</small>
                </span>
              </label>
            </div>
          </section>

          <section className="modal-form-section">
            <div className="modal-section-header">
              <FaShieldAlt className="modal-section-icon" />
              <h3 className="modal-section-title">Modulos del Perfil</h3>
            </div>

            <div className="permission-profiles-page__selector permission-profiles-page__selector-card">
              <div className="permission-profiles-page__selector-head">
                <div>
                  <strong>Accesos incluidos</strong>
                  <small>Selecciona lo que vera el usuario que use este perfil.</small>
                </div>
                <div className="permission-profiles-page__selector-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        modules: [...AVAILABLE_USER_MODULES],
                      }))
                    }
                  >
                    Seleccionar todo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        modules: [],
                      }))
                    }
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>
              <div className="permission-profiles-page__selector-grid">
                {AVAILABLE_USER_MODULES.map((module) => {
                  const isSelected = form.modules.includes(module);
                  return (
                    <button
                      key={module}
                      type="button"
                      className={`permission-profiles-page__selector-item ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => toggleModule(module)}
                    >
                      {USER_MODULE_LABELS[module]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </CreateModalBase>

      <UniqueModalBase
        open={Boolean(selectedProfile)}
        title="Detalle del perfil"
        entityName={selectedProfile?.nombre ?? "Perfil"}
        className="permission-profiles-page__unique-modal"
        isEntityActive={selectedProfile?.estado}
        isSubmitting={isUpdating}
        error={error}
        onClose={closeDetail}
        onEditStart={() => {
          if (!selectedProfile) return;
          openEdit(selectedProfile);
        }}
        onToggleStatus={async () => {
          if (!selectedProfile) return;
          await handleToggleProfileState(selectedProfile);
        }}
        toggleStatusText={selectedProfile?.estado ? "Desactivar" : "Activar"}
      >
        <section className="modal-form-section">
          <div className="modal-section-header">
            <FaIdBadge className="modal-section-icon" />
            <h3 className="modal-section-title">Resumen del Perfil</h3>
          </div>

          <section className="shared-modal-hero permission-profiles-page__hero">
            <span className="shared-modal-hero__badge permission-profiles-page__hero-badge">
              {getProfileInitials(selectedProfile)}
            </span>
            <div className="shared-modal-hero__copy">
              <h4 className="shared-modal-hero__title permission-profiles-page__hero-name">
                {selectedProfile?.nombre ?? "Sin nombre"}
              </h4>
              <p className="shared-modal-hero__meta permission-profiles-page__hero-status">
                {selectedProfile?.estado ? "Perfil activo" : "Perfil inactivo"} · {selectedProfile?.modules.length ?? 0} modulo{selectedProfile?.modules.length === 1 ? "" : "s"}
              </p>
            </div>
          </section>

          <div className="modal-section-grid">
            <article className="form-group permission-profiles-page__detail-item modal-field-full">
              <label>Descripcion</label>
              <p className="permission-profiles-page__detail-value">
                {selectedProfile?.descripcion ?? "Sin descripcion."}
              </p>
            </article>

            <article className="form-group permission-profiles-page__detail-item modal-field-full">
              <label>Modulos asignados</label>
              <div className="permission-profiles-page__detail-modules">
                {selectedProfile?.modules.map((module) => (
                  <span key={module} className="permission-profiles-page__module-chip">
                    {USER_MODULE_LABELS[module]}
                  </span>
                )) ?? <p className="permission-profiles-page__detail-empty">Sin modulos asignados.</p>}
              </div>
            </article>
          </div>
        </section>
      </UniqueModalBase>
    </div>
  );
}
