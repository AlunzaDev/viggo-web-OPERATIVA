import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FaSortAlphaDown,
  FaSortAlphaDownAlt,
  FaUserPlus,
} from "react-icons/fa";
import { CrudActionsIsland } from "../../components/shared/CrudActionsIsland";
import { CrudRowActions } from "../../components/shared/CrudRowActions";
import { CrudStatusBadge } from "../../components/shared/CrudStatusBadge";
import {
  CreateUserModal,
  type CreateUserPayload,
} from "../../components/users/CreateUserModal/CreateUserModal";
import { UniqueUserModal } from "../../components/users/UniqueUserModal/UniqueUserModal";
import { FilterSidebar } from "../../components/shared/FilterSidebar";
import { SidebarFilterField, SidebarFilterForm } from "../../components/shared/SidebarFilterForm";
import { MobileCardsList } from "../../components/shared/lists/MobileCardsList";
import { TableBase } from "../../components/shared/tables/TableBase";
import { useUsers } from "../../hooks/users/useUsers";
import { useMediaQuery } from "../../hooks/shared/useMediaQuery";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import type { UserEntity, UserRole } from "../../../domain/entities/user.entity";
import type { UpdateUserPayload } from "../../../infrastructure/dtos/user/update-user.dto";
import "../../styles/users/UsersPage.css";

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ROLE: "Super Administrador",
  ADMIN_ROLE: "Administrador",
  PENSION_ROLE: "Pension",
  CLIENT_ROLE: "Cliente",
};
const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function UsersPage() {
  usePageTitle("Accesos");

  const shouldReduceMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    users: userRows,
    isLoading,
    isSavingUser,
    isUpdatingUser,
    page,
    pageSize,
    error: userError,
    goToPage,
    changePageSize,
    createUser,
    updateUser,
    toggleUserState,
  } = useUsers();

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [draftStatusFilter, setDraftStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draftRoleFilter, setDraftRoleFilter] = useState<"all" | UserRole>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredBySearch = userRows.filter((user) => {
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q) ||
        user.correo.toLowerCase().includes(q) ||
        user.telefono.toLowerCase().includes(q)
      );
    });

    const filteredByStatus = filteredBySearch.filter((user) => {
      if (statusFilter === "all") return true;
      return statusFilter === "active" ? user.estado : !user.estado;
    });

    const filteredByRole = filteredByStatus.filter((user) => {
      if (roleFilter === "all") return true;
      return user.rol === roleFilter;
    });

    return [...filteredByRole].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [search, sortAsc, statusFilter, roleFilter, userRows]);

  const pageStart = users.length === 0 ? 0 : (page - 1) * pageSize;
  const pageEnd = Math.min(page * pageSize, users.length);
  const visibleUsers = users.slice(pageStart, pageEnd);
  const displayTotalItems = users.length;
  const displayTotalPages = Math.max(1, Math.ceil(displayTotalItems / pageSize));

  useEffect(() => {
    if (page > displayTotalPages) {
      goToPage(displayTotalPages);
    }
  }, [displayTotalPages, goToPage, page]);

  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) +
    (roleFilter !== "all" ? 1 : 0);

  const handleCreateUser = async (payload: CreateUserPayload) => {
    if (!payload.password) {
      throw new Error("La contrasena es obligatoria para crear el acceso.");
    }
    await createUser({
      nombre: payload.nombre,
      apellido: payload.apellido,
      correo: payload.correo,
      telefono: payload.telefono,
      password: payload.password,
      rol: payload.rol,
      coordinates: payload.coordinates,
      nacimiento: payload.nacimiento,
      img: payload.img,
      estado: payload.estado,
      google: payload.google,
      emailValidated: payload.emailValidated,
      parkings: payload.parkings,
      permissionProfileId: payload.permissionProfileId,
      modules: payload.modules,
    });
    setIsCreateOpen(false);
  };

  const handleEditUser = async (payload: CreateUserPayload) => {
    if (!editingUser) return;

    const updatePayload: UpdateUserPayload = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      correo: payload.correo,
      telefono: payload.telefono,
      rol: payload.rol,
      coordinates: payload.coordinates,
      nacimiento: payload.nacimiento,
      img: payload.img,
      estado: payload.estado,
      google: payload.google,
      parkings: payload.parkings,
      permissionProfileId: payload.permissionProfileId,
      modules: payload.modules,
      ...(payload.password ? { password: payload.password } : {}),
    };

    const updatedUser = await updateUser(editingUser.id, updatePayload);
    setEditingUser(null);
    setSelectedUser(updatedUser);
  };

  const handleToggleUserState = async (userId: string, nextState: boolean) => {
    const updatedUser = await toggleUserState(userId, nextState);
    setSelectedUser(updatedUser);
  };

  useEffect(() => {
    if (!selectedUser) return;
    const refreshedUser = userRows.find((user) => user.id === selectedUser.id);
    if (refreshedUser) setSelectedUser(refreshedUser);
  }, [userRows, selectedUser]);

  return (
    <div className="users-page">
      <CrudActionsIsland
        className="users-island"
        searchValue={search}
        onSearchChange={(event) => {
          setSearch(event.target.value);
          goToPage(1);
        }}
        onSearchClear={() => {
          setSearch("");
          goToPage(1);
        }}
        searchPlaceholder="Buscar por nombre, correo o telefono"
        showFilter
        onToggleFilter={() =>
          setIsFilterOpen((prev) => {
            if (!prev) {
              setDraftStatusFilter(statusFilter);
              setDraftRoleFilter(roleFilter);
            }
            return !prev;
          })
        }
        isFilterOpen={isFilterOpen}
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => {
          setStatusFilter("all");
          setRoleFilter("all");
          setDraftStatusFilter("all");
          setDraftRoleFilter("all");
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
        createIcon={<FaUserPlus />}
        createLabel="Crear Acceso"
        onCreate={() => {
          setIsCreateOpen(true);
        }}
      />

      <FilterSidebar
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {
          setStatusFilter(draftStatusFilter);
          setRoleFilter(draftRoleFilter);
          goToPage(1);
          setIsFilterOpen(false);
        }}
        onReset={() => {
          setDraftStatusFilter("all");
          setDraftRoleFilter("all");
        }}
        title="Filtros de Accesos"
      >
        <SidebarFilterForm>
          <SidebarFilterField label="Estado" htmlFor="status-filter">
            <select
              id="status-filter"
              value={draftStatusFilter}
              onChange={(event) => {
                setDraftStatusFilter(event.target.value as "all" | "active" | "inactive");
              }}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </SidebarFilterField>

          <SidebarFilterField label="Rol" htmlFor="role-filter">
            <select
              id="role-filter"
              value={draftRoleFilter}
              onChange={(event) => {
                setDraftRoleFilter(event.target.value as "all" | UserRole);
              }}
            >
              <option value="all">Todos</option>
              <option value="SUPER_ROLE">Super Administrador</option>
              <option value="ADMIN_ROLE">Administrador</option>
              <option value="PENSION_ROLE">Pension</option>
              <option value="CLIENT_ROLE">Cliente</option>
            </select>
          </SidebarFilterField>
        </SidebarFilterForm>
      </FilterSidebar>

      <CreateUserModal
        open={isCreateOpen}
        onClose={() => {
          if (isSavingUser) return;
          setIsCreateOpen(false);
        }}
        onSubmit={handleCreateUser}
        isSubmitting={isSavingUser}
        errorMessage={userError}
      />

      <CreateUserModal
        open={Boolean(editingUser)}
        mode="edit"
        initialValues={editingUser}
        onClose={() => {
          if (isUpdatingUser) return;
          setEditingUser(null);
        }}
        onSubmit={handleEditUser}
        isSubmitting={isUpdatingUser}
        errorMessage={userError}
      />

      <UniqueUserModal
        open={Boolean(selectedUser)}
        user={selectedUser}
        isSubmitting={isUpdatingUser}
        errorMessage={userError}
        onEdit={(user) => {
          setSelectedUser(null);
          setEditingUser(user);
        }}
        onToggleStatus={handleToggleUserState}
        onClose={() => setSelectedUser(null)}
      />

      {isMobile ? (
        <MobileCardsList
          isLoading={isLoading && userRows.length === 0}
          isEmpty={visibleUsers.length === 0}
          emptyMessage="No se encontraron accesos con ese filtro."
          page={page}
          pageSize={pageSize}
          totalItems={displayTotalItems}
          totalPages={displayTotalPages}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSizeLabel="Tarjetas"
        >
          {visibleUsers.map((user, index) => (
            <motion.div
              key={user.id}
              className="mobile-data-card--button"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.08 }
                  : { duration: 0.16, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.02, 0.15) }
              }
            >
              <div className="mobile-data-card__header">
                <h3 className="mobile-data-card__title">{user.name}</h3>
                <span className={`app-status-pill users-badge users-badge--status ${user.estado ? "users-badge--active" : "users-badge--inactive"}`}>
                  {user.estado ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mobile-data-card__fields">
                <div className="mobile-data-card__field">
                  <span className="mobile-data-card__label">Correo</span>
                  <span className="mobile-data-card__value">{user.correo}</span>
                </div>

                <div className="mobile-data-card__field">
                  <span className="mobile-data-card__label">Telefono</span>
                  <span className="mobile-data-card__value">{user.telefono}</span>
                </div>

                <div className="mobile-data-card__field">
                  <span className="mobile-data-card__label">Rol</span>
                  <span className="mobile-data-card__value">
                    <span className={`users-badge users-badge--role users-badge--${user.rol}`}>
                      {ROLE_LABEL[user.rol]}
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </MobileCardsList>
      ) : (
        <TableBase
          withCard={false}
          isLoading={isLoading && userRows.length === 0}
          isEmpty={visibleUsers.length === 0}
          emptyMessage="No se encontraron accesos con ese filtro."
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
              <th className="col-email">Correo</th>
              <th className="col-phone">Telefono</th>
              <th className="col-role">Rol</th>
              <th className="col-status">Estado</th>
              <th className="col-actions">Acciones</th>
            </tr>
          }
        >
          {visibleUsers.map((user, index) => (
            <motion.tr
              key={user.id}
              className="base-table__row"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.08 }
                  : { duration: 0.16, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.02, 0.15) }
              }
            >
              <td className="col-name">{user.name}</td>
              <td className="col-email">{user.correo}</td>
              <td className="col-phone">{user.telefono}</td>
              <td className="col-role">
                <span className={`users-badge users-badge--role users-badge--${user.rol}`}>
                  {ROLE_LABEL[user.rol]}
                </span>
              </td>
              <td className="col-status">
                <CrudStatusBadge label={user.estado ? "Activo" : "Inactivo"} variant={user.estado ? "active" : "inactive"} />
              </td>
              <td className="col-actions">
                <CrudRowActions
                  entityName={`acceso ${user.name}`}
                  isActive={user.estado}
                  onView={() => setSelectedUser(user)}
                  onEdit={() => setEditingUser(user)}
                  onToggleStatus={() => handleToggleUserState(user.id, !user.estado)}
                />
              </td>
            </motion.tr>
          ))}
        </TableBase>
      )}
    </div>
  );
}
