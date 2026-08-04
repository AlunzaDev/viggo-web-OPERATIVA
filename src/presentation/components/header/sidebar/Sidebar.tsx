import "./sidebar.css";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { FaBroadcastTower, FaCashRegister, FaChartLine, FaChevronDown, FaChartPie, FaCog, FaCreditCard, FaExchangeAlt, FaExclamationTriangle, FaIdCard, FaReceipt, FaTicketAlt, FaWallet } from "react-icons/fa";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { hasModuleAccess } from "../../../../domain/entities/module-access";
import { useAuth } from "../../../context/auth/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SidebarNavItemProps = {
  path: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: (path: string) => void;
};

type SidebarDockIconProps = {
  mouseY: MotionValue<number>;
  isCollapsed: boolean;
  className?: string;
  children: ReactNode;
};

const SidebarDockIcon = ({
  mouseY,
  isCollapsed,
  className,
  children,
}: SidebarDockIconProps) => {
  const iconRef = useRef<HTMLDivElement | null>(null);

  const distance = useTransform(mouseY, (currentY) => {
    const bounds = iconRef.current?.getBoundingClientRect();
    if (!bounds) return Number.POSITIVE_INFINITY;
    const centerY = bounds.top + bounds.height / 2;
    return currentY - centerY;
  });

  const proximity = useTransform(distance, (offset) => {
    const clampRange = Math.min(Math.abs(offset), 220);
    return Math.max(0, 1 - clampRange / 220);
  });

  const orbScale = useTransform(proximity, [0, 1], [1, isCollapsed ? 1.42 : 1.2]);
  const glyphScale = useTransform(proximity, [0, 1], [1, isCollapsed ? 1.12 : 1.05]);
  const targetX = useTransform(proximity, [0, 1], [0, isCollapsed ? 5 : 2]);
  const targetY = useTransform(proximity, [0, 1], [0, -1.5]);
  const bgAlpha = useTransform(proximity, [0, 1], [0, isCollapsed ? 0.16 : 0.1]);
  const glowAlpha = useTransform(proximity, [0, 1], [0, isCollapsed ? 0.2 : 0.12]);

  const orbScaleSpring = useSpring(orbScale, { mass: 0.2, stiffness: 320, damping: 22 });
  const glyphScaleSpring = useSpring(glyphScale, { mass: 0.2, stiffness: 320, damping: 22 });
  const x = useSpring(targetX, { mass: 0.2, stiffness: 340, damping: 22 });
  const y = useSpring(targetY, { mass: 0.2, stiffness: 340, damping: 22 });

  const bgP = useTransform(bgAlpha, (a) => Math.round(a * 100));
  const glowP = useTransform(glowAlpha, (a) => Math.round(a * 100));
  const background = useMotionTemplate`color-mix(in srgb, var(--primary-color) ${bgP}%, transparent)`;
  const boxShadow = useMotionTemplate`0 0 0 1px color-mix(in srgb, var(--primary-color) ${glowP}%, transparent), 0 10px 20px rgba(0, 0, 0, ${glowAlpha})`;

  return (
    <motion.div
      ref={iconRef}
      className={`sidebar-motion-icon ${isCollapsed ? "is-collapsed" : ""} ${className ?? ""}`}
      style={{ x, y }}
    >
      <motion.span
        className="sidebar-motion-orb"
        style={{ scale: orbScaleSpring, background, boxShadow }}
      />
      <motion.span className="sidebar-motion-glyph" style={{ scale: glyphScaleSpring }}>
        {children}
      </motion.span>
    </motion.div>
  );
};

const SidebarNavItem = memo(({ path, label, icon, isActive, onClick }: SidebarNavItemProps) => (
  <li className={isActive ? "active clickable" : "clickable"} onClick={() => onClick(path)}>
    <span className="sidebar-text">{label}</span>
    {icon}
  </li>
));

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ isOpen, onClose }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userModules = user?.modules;
  const isSuperAdmin = user?.role === "superRole";
  const mouseY = useMotionValue(-1000);
  const isCollapsed = !isOpen;

  const canViewCashPayments =
    isSuperAdmin ||
    hasModuleAccess(userModules, "cashPayments") ||
    hasModuleAccess(userModules, "payments");
  const canViewTickets = isSuperAdmin || hasModuleAccess(userModules, "tickets");
  const canViewPensions = isSuperAdmin || hasModuleAccess(userModules, "pensions");
  const canViewPensionPasses =
    isSuperAdmin || hasModuleAccess(userModules, "pensionPasses");
  const canViewPensionMoves =
    isSuperAdmin || hasModuleAccess(userModules, "pensionMoves");
  const canViewPayments = isSuperAdmin || hasModuleAccess(userModules, "payments");
  const canViewDeviceHeartbeat = isSuperAdmin || hasModuleAccess(userModules, "modules");
  const canViewOperationalLogs =
    isSuperAdmin ||
    hasModuleAccess(userModules, "modules") ||
    hasModuleAccess(userModules, "cashPayments") ||
    hasModuleAccess(userModules, "payments") ||
    hasModuleAccess(userModules, "tickets");
  const isCajaRoute =
    location.pathname.startsWith("/caja") || location.pathname.startsWith("/cobro-caja");
  const isPensionsRoute =
    location.pathname.startsWith("/pensiones") ||
    location.pathname.startsWith("/pension-pass") ||
    location.pathname.startsWith("/movimientos");
  const [isCajaOpen, setIsCajaOpen] = useState(isCajaRoute);
  const [isPensionsOpen, setIsPensionsOpen] = useState(isPensionsRoute);

  const go = useCallback(
    (path: string) => {
      navigate(path);
      if (window.innerWidth <= 768) onClose();
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (isCajaRoute) {
      setIsCajaOpen(true);
    }
  }, [isCajaRoute]);

  useEffect(() => {
    if (isPensionsRoute) {
      setIsPensionsOpen(true);
    }
  }, [isPensionsRoute]);

  useEffect(() => {
    if (!isCollapsed) mouseY.set(-1000);
  }, [isCollapsed, mouseY]);

  const handleSidebarMouseMove = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      mouseY.set(event.clientY);
    },
    [mouseY],
  );

  const handleSidebarMouseLeave = useCallback(() => {
    mouseY.set(-1000);
  }, [mouseY]);

  const renderMenuIcon = useCallback(
    (icon: ReactNode) => {
      if (!isCollapsed) {
        return (
          <span className="sidebar-motion-icon">
            <span className="sidebar-motion-glyph">{icon}</span>
          </span>
        );
      }

      return (
        <SidebarDockIcon mouseY={mouseY} isCollapsed>
          {icon}
        </SidebarDockIcon>
      );
    },
    [isCollapsed, mouseY],
  );

  const navItems = useMemo(
    () => [
      {
        path: "/bitacora",
        label: "Bitacora",
        icon: <FaExclamationTriangle className="sidebar-icon" />,
        canView: canViewOperationalLogs,
        isActive: location.pathname.startsWith("/bitacora"),
      },
      {
        path: "/heartbeat",
        label: "Heartbeat",
        icon: <FaBroadcastTower className="sidebar-icon" />,
        canView: canViewDeviceHeartbeat,
        isActive: location.pathname.startsWith("/heartbeat") || location.pathname.startsWith("/device-map"),
      },
      {
        path: "/tickets",
        label: "Tickets",
        icon: <FaReceipt className="sidebar-icon" />,
        canView: canViewTickets,
        isActive: location.pathname.startsWith("/tickets"),
      },
      {
        path: "/pagos",
        label: "Pagos",
        icon: <FaCreditCard className="sidebar-icon" />,
        canView: canViewPayments,
        isActive: location.pathname.startsWith("/pagos"),
      },
      {
        path: "/account",
        label: "Cuenta",
        icon: <FaCog className="sidebar-icon" />,
        canView: true,
        isActive: location.pathname.startsWith("/account") || location.pathname.startsWith("/settings"),
      },
    ],
    [canViewDeviceHeartbeat, canViewOperationalLogs, canViewPayments, canViewTickets, location.pathname],
  );

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        ref={ref}
        className={`sidebar ${isOpen ? "open" : "collapsed"}`}
        onMouseMove={isCollapsed ? handleSidebarMouseMove : undefined}
        onMouseLeave={isCollapsed ? handleSidebarMouseLeave : undefined}
      >
        <ul>
          <SidebarNavItem
            path="/dashboard"
            label="Inicio"
            icon={renderMenuIcon(<FaChartPie className="sidebar-icon" />)}
            isActive={location.pathname.startsWith("/dashboard")}
            onClick={go}
          />

          {canViewCashPayments ? (
            <li className="sidebar-nav-group sidebar-nav-group--cash">
              <div
                className={`sidebar-nav-item clickable${isCajaRoute ? " active" : ""}`}
                onClick={() => setIsCajaOpen((value) => !value)}
              >
                <span className="sidebar-text">Caja</span>
                <span className="sidebar-nav-action">
                  <button
                    type="button"
                    className="sidebar-collapse-btn"
                    aria-label={isCajaOpen ? "Cerrar modulo Caja" : "Abrir modulo Caja"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsCajaOpen((value) => !value);
                    }}
                  >
                    <FaChevronDown
                      className={`sidebar-chevron${isCajaOpen ? " is-open" : ""}`}
                    />
                  </button>
                  {renderMenuIcon(<FaCashRegister className="sidebar-icon" />)}
                </span>
              </div>

              {isCajaOpen ? (
                <ul className="sidebar-subnav sidebar-subnav--cash">
                  <li
                    className={`sidebar-subnav-item clickable${
                      location.pathname.startsWith("/caja/cobro") ||
                      location.pathname.startsWith("/cobro-caja")
                        ? " active"
                        : ""
                    }`}
                    onClick={() => go("/caja/cobro")}
                  >
                    <span className="sidebar-text">Cobro</span>
                    {renderMenuIcon(<FaWallet className="sidebar-icon" />)}
                  </li>
                  <li
                    className={`sidebar-subnav-item clickable${
                      location.pathname.startsWith("/caja/turno") ? " active" : ""
                    }`}
                    onClick={() => go("/caja/turno")}
                  >
                    <span className="sidebar-text">Turno de caja</span>
                    {renderMenuIcon(<FaReceipt className="sidebar-icon" />)}
                  </li>
                  <li
                    className={`sidebar-subnav-item clickable${
                      location.pathname.startsWith("/caja/historial") ? " active" : ""
                    }`}
                    onClick={() => go("/caja/historial")}
                  >
                    <span className="sidebar-text">Historial</span>
                    {renderMenuIcon(<FaChartLine className="sidebar-icon" />)}
                  </li>
                </ul>
              ) : null}
            </li>
          ) : null}

          {navItems.map((item) =>
            item.canView ? (
              <SidebarNavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={renderMenuIcon(item.icon)}
                isActive={item.isActive}
                onClick={go}
              />
            ) : null,
          )}

          {canViewPensions || canViewPensionPasses || canViewPensionMoves ? (
            <li className="sidebar-nav-group sidebar-nav-group--pensions">
              <div
                className={`sidebar-nav-item clickable${isPensionsRoute ? " active" : ""}`}
                onClick={() => setIsPensionsOpen((value) => !value)}
              >
                <span className="sidebar-text">Pensiones</span>
                <span className="sidebar-nav-action">
                  <button
                    type="button"
                    className="sidebar-collapse-btn"
                    aria-label={isPensionsOpen ? "Cerrar Pensiones" : "Abrir Pensiones"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsPensionsOpen((value) => !value);
                    }}
                  >
                    <FaChevronDown
                      className={`sidebar-chevron${isPensionsOpen ? " is-open" : ""}`}
                    />
                  </button>
                  {renderMenuIcon(<FaTicketAlt className="sidebar-icon" />)}
                </span>
              </div>

              {isPensionsOpen ? (
                <ul className="sidebar-subnav sidebar-subnav--pensions">
                  {canViewPensions ? (
                    <li
                      className={`sidebar-subnav-item clickable${
                        location.pathname.startsWith("/pensiones") ? " active" : ""
                      }`}
                      onClick={() => go("/pensiones")}
                    >
                      <span className="sidebar-text">Pensiones</span>
                      {renderMenuIcon(<FaTicketAlt className="sidebar-icon" />)}
                    </li>
                  ) : null}
                  {canViewPensionPasses ? (
                    <li
                      className={`sidebar-subnav-item clickable${
                        location.pathname.startsWith("/pension-pass") ? " active" : ""
                      }`}
                      onClick={() => go("/pension-pass")}
                    >
                      <span className="sidebar-text">Pension Pass</span>
                      {renderMenuIcon(<FaIdCard className="sidebar-icon" />)}
                    </li>
                  ) : null}
                  {canViewPensionMoves ? (
                    <li
                      className={`sidebar-subnav-item clickable${
                        location.pathname.startsWith("/movimientos") ? " active" : ""
                      }`}
                      onClick={() => go("/movimientos")}
                    >
                      <span className="sidebar-text">Movimientos</span>
                      {renderMenuIcon(<FaExchangeAlt className="sidebar-icon" />)}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      </aside>
    </>
  );
});
