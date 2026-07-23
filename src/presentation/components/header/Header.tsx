import { useEffect, useState, type Ref } from "react";
import { FaBars, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { resolveInitialTheme, type ThemeMode } from "../../../config/theme-mode";
import "./Header.css";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleUserSidebar: () => void;
  isUserSidebarOpen: boolean;
  toggleButtonRef: Ref<HTMLButtonElement>;
  userToggleButtonRef: Ref<HTMLButtonElement>;
  hideSidebarToggle?: boolean;
  pageTitle?: string;
}

export function Header({
  toggleSidebar,
  toggleUserSidebar,
  isUserSidebarOpen,
  toggleButtonRef,
  userToggleButtonRef,
  hideSidebarToggle = false,
  pageTitle = "",
}: HeaderProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      const nextTheme = root.getAttribute("data-theme");
      setTheme(nextTheme === "light" ? "light" : "dark");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const headerLogoSrc =
    theme === "light"
      ? "/logos/viggo_icon_black.png"
      : "/logos/viggo_icon_white.png";

  return (
    <header className="header-container">
      <div className="header-left">
        {!hideSidebarToggle && (
          <button
            className="header-icon-btn sidebar-toggle-btn"
            onClick={toggleSidebar}
            ref={toggleButtonRef}
            type="button"
            aria-label="Abrir o cerrar menu"
            title="Menu"
          >
            <FaBars className="hamburger-icon" />
          </button>
        )}

        <button
          type="button"
          className="header-logo-btn"
          title="Ir al Dashboard"
          aria-label="Ir al Dashboard"
          onClick={() => navigate("/dashboard")}
        >
          <img
            className="header-logo-image"
            src={headerLogoSrc}
            alt="Viggo"
          />
        </button>

        {pageTitle ? <h1 className="header-page-title">{pageTitle}</h1> : null}
      </div>

      <div className="header-user">
        <button
          className={`header-user-btn ${isUserSidebarOpen ? "is-active" : ""}`}
          ref={userToggleButtonRef}
          type="button"
          aria-label="Abrir menu de usuario"
          title="Abrir menu de usuario"
          aria-expanded={isUserSidebarOpen}
          onClick={toggleUserSidebar}
        >
          <FaUser className="header-avatar-icon" />
        </button>
      </div>
    </header>
  );
}
