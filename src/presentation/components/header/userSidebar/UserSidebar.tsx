import { forwardRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaSignOutAlt, FaTimes, FaUser } from "react-icons/fa";
import Swal from "sweetalert2";
import "./UserSidebar.css";

type SidebarUserInfo = {
  name?: string;
  role?: string;
  email?: string;
  id?: string;
  avatarUrl?: string | null;
};

type UserSidebarProps = {
  isOpen: boolean;
  toggle: () => void;
  user?: SidebarUserInfo;
  onLogout?: () => Promise<void> | void;
};

export const UserSidebar = forwardRef<HTMLDivElement, UserSidebarProps>(
  ({ isOpen, toggle, user, onLogout }, ref) => {
    const navigate = useNavigate();

    const roleLabel = useMemo(() => {
      if (!user?.role) return "Administrador";

      if (user.role === "superRole") return "Super Administrador";
      if (user.role === "adminRole") return "Administrador";
      if (user.role === "monitRole") return "Monitor";
      return user.role;
    }, [user?.role]);

    useEffect(() => {
      if (!isOpen) return;

      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") toggle();
      };

      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [isOpen, toggle]);

    const handleNavigate = useCallback(
      (path: string) => {
        navigate(path);
        toggle();
      },
      [navigate, toggle]
    );

    const handleLogout = useCallback(async () => {
      const result = await Swal.fire({
        title: "Cerrar sesión?",
        text: "Tendras que ingresar tus credenciales nuevamente para acceder.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Si, salir",
        cancelButtonText: "Cancelar",
        background: "transparent",
        customClass: {
          popup: "swal-custom-popup",
          title: "swal-custom-title",
          htmlContainer: "swal-custom-text",
        },
      });

      if (!result.isConfirmed) return;

      if (onLogout) {
        await onLogout();
      }

      navigate("/login");
      toggle();
    }, [navigate, onLogout, toggle]);

    if (!isOpen) {
      return (
        <>
          <div className="user-overlay" aria-hidden="true" />
          <aside
            ref={ref}
            className="user-sidebar"
            aria-label="Menu de usuario"
            aria-hidden="true"
          />
        </>
      );
    }

    return (
      <>
        <div
          className={`user-overlay ${isOpen ? "is-open" : ""}`}
          onClick={toggle}
          aria-hidden={!isOpen}
        />

        <aside
          ref={ref}
          className={`user-sidebar ${isOpen ? "is-open" : ""}`}
          aria-label="Menu de usuario"
        >
          <div className="user-sidebar-header">
            <h2>Mi Perfil</h2>
            <button className="close-btn" onClick={toggle} aria-label="Cerrar menu" type="button">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="user-sidebar-content">
            <div className="user-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={`Avatar de ${user?.name ?? "usuario"}`} />
              ) : (
                <div className="default-avatar">
                  <FaUser />
                </div>
              )}
            </div>

            <div className="user-info">
              <p>
                <strong>Nombre</strong>
                <span title={user?.name || "Usuario Sikkounter"}>{user?.name || "Usuario Sikkounter"}</span>
              </p>
              <p>
                <strong>Rol</strong>
                <span title={roleLabel}>{roleLabel}</span>
              </p>
              <p className="user-info-email">
                <strong>Email</strong>
                <span title={user?.email || "admin@sikkounter.com"}>{user?.email || "admin@sikkounter.com"}</span>
              </p>
            </div>

            <div className="user-logout-wrapper">
              <button
                className="user-action-btn"
                onClick={() => handleNavigate("/account")}
                type="button"
              >
                <FaCog className="user-action-icon" />
                Configuración
              </button>

              <button className="user-logout-btn" onClick={handleLogout} type="button">
                <FaSignOutAlt />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }
);

UserSidebar.displayName = "UserSidebar";

