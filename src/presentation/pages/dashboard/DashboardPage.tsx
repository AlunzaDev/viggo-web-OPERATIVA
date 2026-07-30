import type { ReactNode } from "react";
import { FaBroadcastTower, FaCashRegister, FaReceipt, FaTicketAlt, FaUserCog, FaWallet } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { hasModuleAccess, type AppModuleAccess } from "../../../domain/entities/module-access";
import type { AppUserRole } from "../../../domain/entities/role.utils";
import { useAuth } from "../../context/auth/useAuth";
import "./DashboardPage.css";

type QuickAction = {
  label: string;
  helper: string;
  path: string;
  icon: ReactNode;
  modules?: AppModuleAccess[];
  roles?: AppUserRole[];
};

const ROLE_COPY: Record<AppUserRole, string> = {
  superRole: "Tienes control amplio del punto local y acceso a supervision segun los modulos activos.",
  adminRole: "Tu vista esta enfocada a operacion y seguimiento del sitio con accesos administrativos.",
  monitRole: "Tu tablero prioriza cobro, monitoreo y tareas del dia a dia para operar sin distracciones.",
};

const getVisibleActions = (
  actions: QuickAction[],
  userModules: AppModuleAccess[],
  userRole: AppUserRole,
) =>
  actions.filter((action) => {
    if (action.path === "/account") return true;

    if (action.roles && !action.roles.includes(userRole)) {
      return false;
    }

    if (action.modules && !action.modules.some((module) => hasModuleAccess(userModules, module))) {
      return false;
    }

    return true;
  });

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role ?? "monitRole";
  const userModules = user?.modules ?? [];

  const quickActions = getVisibleActions(
    [
      {
        label: "Cobro",
        helper: "Entrar directo a la caja",
        path: "/caja/cobro",
        icon: <FaWallet />,
        modules: ["cashPayments", "payments"],
      },
      {
        label: "Turno de caja",
        helper: "Revisar apertura y cierre",
        path: "/caja/turno",
        icon: <FaCashRegister />,
        modules: ["cashPayments", "payments"],
      },
      {
        label: "Heartbeat",
        helper: "Ver el estado de modulos y equipos",
        path: "/heartbeat",
        icon: <FaBroadcastTower />,
        modules: ["modules"],
      },
      {
        label: "Tickets",
        helper: "Consultar operaciones recientes",
        path: "/tickets",
        icon: <FaReceipt />,
        modules: ["tickets"],
      },
      {
        label: "Pensiones",
        helper: "Entrar a los flujos de pension",
        path: "/pensiones",
        icon: <FaTicketAlt />,
        modules: ["pensions"],
      },
      {
        label: "Cuenta",
        helper: "Ajustar sesion y configuracion local",
        path: "/account",
        icon: <FaUserCog />,
      },
    ],
    userModules,
    userRole,
  );

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero dashboard-hero--single">
        <div className="dashboard-hero__content">
          <span className="dashboard-eyebrow">Panel operativo</span>
          <h1>Hola, {user?.name || "usuario Viggo"}</h1>
          <p>
            {ROLE_COPY[userRole]}
          </p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--single">
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Accesos rapidos</h2>
            <p>Entradas directas para que el operador llegue a donde importa.</p>
          </div>

          <div className="dashboard-actions">
            {quickActions.map((action) => (
              <button
                key={action.path}
                type="button"
                className="dashboard-action"
                onClick={() => navigate(action.path)}
              >
                <span className="dashboard-action__icon">{action.icon}</span>
                <span className="dashboard-action__body">
                  <strong>{action.label}</strong>
                  <small>{action.helper}</small>
                </span>
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
