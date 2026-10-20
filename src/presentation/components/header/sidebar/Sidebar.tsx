import { forwardRef, useMemo } from "react";
import {
  FaBroadcastTower,
  FaChartLine,
  FaChartPie,
  FaCog,
  FaCreditCard,
  FaCubes,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaIdCard,
  FaReceipt,
  FaTags,
  FaTicketAlt,
  FaWallet,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { NavSidebar, type NavSidebarGroup } from "@alunzadev/viggo-ui";
import { hasModuleAccess } from "../../../../domain/entities/module-access";
import { useAuth } from "../../../context/auth/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/** OPERATIVO menu; the sidebar itself comes from viggo-ui. */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ isOpen, onClose }, ref) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const groups = useMemo<NavSidebarGroup[]>(() => {
    const modules = user?.modules;
    const isSuperAdmin = user?.role === "superRole";
    const can = (...required: Parameters<typeof hasModuleAccess>[1][]) =>
      isSuperAdmin || required.some((module) => hasModuleAccess(modules, module));
    return [
      {
        id: "inicio",
        label: "Inicio",
        items: [{ label: "Inicio", path: "/dashboard", icon: <FaChartPie /> }],
      },
      {
        id: "caja",
        label: "Caja",
        visible: can("cashPayments", "payments"),
        items: [
          { label: "Cobro", path: "/caja/cobro", icon: <FaWallet />, activePaths: ["/caja/cobro", "/cobro-caja"] },
          { label: "Turno de caja", path: "/caja/turno", icon: <FaReceipt /> },
          { label: "Historial", path: "/caja/historial", icon: <FaChartLine /> },
        ],
      },
      {
        id: "pensiones",
        label: "Pensiones",
        items: [
          { label: "Pensiones", path: "/pensiones", icon: <FaTicketAlt />, visible: can("pensions") },
          { label: "Pension Pass", path: "/pension-pass", icon: <FaIdCard />, visible: can("pensionPasses") },
          { label: "Movimientos", path: "/movimientos", icon: <FaExchangeAlt />, visible: can("pensionMoves") },
        ],
      },
      {
        id: "operacion",
        label: "Operación",
        items: [
          { label: "Bitacora", path: "/bitacora", icon: <FaExclamationTriangle />, visible: can("modules", "cashPayments", "payments", "tickets") },
          { label: "Modulos", path: "/modulos", icon: <FaCubes />, visible: can("modules") },
          { label: "Heartbeat", path: "/heartbeat", icon: <FaBroadcastTower />, visible: can("modules"), activePaths: ["/heartbeat", "/device-map"] },
          { label: "Tickets", path: "/tickets", icon: <FaReceipt />, visible: can("tickets") },
        ],
      },
      {
        id: "pagos",
        label: "Pagos",
        items: [{ label: "Pagos", path: "/pagos", icon: <FaCreditCard />, visible: can("payments") }],
      },
      {
        id: "configuracion",
        label: "Configuración",
        items: [
          { label: "Tarifa", path: "/tarifa", icon: <FaTags /> },
          { label: "Cuenta", path: "/account", icon: <FaCog />, activePaths: ["/account", "/settings"] },
        ],
      },
    ];
  }, [user?.modules, user?.role]);

  return (
    <NavSidebar ref={ref} groups={groups} pathname={pathname} onNavigate={navigate} isOpen={isOpen} onClose={onClose} />
  );
});

Sidebar.displayName = "Sidebar";
