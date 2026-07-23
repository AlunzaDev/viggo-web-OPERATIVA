import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { Header } from "../header/Header";
import { Sidebar } from "../header/sidebar/Sidebar";
import { UserSidebar } from "../header/userSidebar/UserSidebar";
import { PageLoadingProvider } from "../shared/loading/PageLoadingContext";
import { usePageLoadingState } from "../shared/loading/usePageLoading";
import { ScreenLoader } from "../shared/loading/ScreenLoader";
import { useAuth } from "../../context/auth/useAuth";
import { PageTitleProvider } from "../../context/page-title/PageTitleContext";
import { useCurrentPageTitle } from "../../context/page-title/usePageTitle";
import "./MainLayout.css";

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_KEY = "sikk_sidebar_open";
const ROUTE_LOADING_MS = 420;

const readSidebarState = () => {
  try {
    const raw = localStorage.getItem(SIDEBAR_KEY);
    if (!raw) return false;
    return JSON.parse(raw) as boolean;
  } catch {
    return false;
  }
};

const persistSidebarState = (value: boolean) => {
  try {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(value));
  } catch {
    // no-op
  }
};

function MainLayoutContent({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pageTitle = useCurrentPageTitle();
  const { isPageLoading, label: pageLoadingLabel } = usePageLoadingState();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => readSidebarState());
  const [userSidebarOpen, setUserSidebarOpen] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userSidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const userToggleButtonRef = useRef<HTMLButtonElement>(null);
  const routeKeyRef = useRef(location.key);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      persistSidebarState(next);
      return next;
    });
  }, []);

  const handleToggleUserSidebar = useCallback(() => {
    setUserSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    persistSidebarState(false);
  }, []);

  const closeUserSidebar = useCallback(() => {
    setUserSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const syncSidebarForViewport = (isMobileViewport: boolean) => {
      if (!isMobileViewport) return;
      setSidebarOpen(false);
      persistSidebarState(false);
    };

    syncSidebarForViewport(mediaQuery.matches);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      syncSidebarForViewport(event.matches);
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  useLayoutEffect(() => {
    if (routeKeyRef.current === location.key) return;

    routeKeyRef.current = location.key;
    setIsRouteLoading(true);

    let firstFrame = 0;
    let secondFrame = 0;
    const timeoutId = window.setTimeout(() => {
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          setIsRouteLoading(false);
        });
      });
    }, ROUTE_LOADING_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [location.key]);

  useEffect(() => {
    if (!sidebarOpen && !userSidebarOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (toggleButtonRef.current?.contains(target)) return;
      if (userToggleButtonRef.current?.contains(target)) return;
      if (sidebarRef.current?.contains(target)) return;
      if (userSidebarRef.current?.contains(target)) return;

      if (sidebarOpen) closeSidebar();
      if (userSidebarOpen) closeUserSidebar();
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [sidebarOpen, userSidebarOpen, closeSidebar, closeUserSidebar]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlScrollbarGutter = document.documentElement.style.getPropertyValue(
      "scrollbar-gutter"
    );
    const previousBodyScrollbarGutter = document.body.style.getPropertyValue(
      "scrollbar-gutter"
    );

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.setProperty("scrollbar-gutter", "auto");
    document.body.style.setProperty("scrollbar-gutter", "auto");

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (previousHtmlScrollbarGutter) {
        document.documentElement.style.setProperty("scrollbar-gutter", previousHtmlScrollbarGutter);
      } else {
        document.documentElement.style.removeProperty("scrollbar-gutter");
      }
      if (previousBodyScrollbarGutter) {
        document.body.style.setProperty("scrollbar-gutter", previousBodyScrollbarGutter);
      } else {
        document.body.style.removeProperty("scrollbar-gutter");
      }
    };
  }, []);

  const showGlobalLoader = isRouteLoading || isPageLoading;
  const globalLoaderLabel = isPageLoading ? pageLoadingLabel : pageTitle || "vista";

  return (
    <>
      <Sidebar ref={sidebarRef} isOpen={sidebarOpen} onClose={closeSidebar} />

      <Header
        toggleSidebar={handleToggleSidebar}
        toggleUserSidebar={handleToggleUserSidebar}
        isUserSidebarOpen={userSidebarOpen}
        toggleButtonRef={toggleButtonRef}
        userToggleButtonRef={userToggleButtonRef}
        pageTitle={pageTitle}
      />

      <UserSidebar
        ref={userSidebarRef}
        isOpen={userSidebarOpen}
        toggle={closeUserSidebar}
        onLogout={logout}
        user={{
          name: user?.name,
          email: user?.email,
          role: user?.role,
          id: user?.id,
          avatarUrl: null,
        }}
      />

      <main
        className={`main-content ${showGlobalLoader ? "is-route-loading" : ""}`}
        aria-busy={showGlobalLoader}
      >
        {children}
        {showGlobalLoader ? (
          <div className="main-layout-route-loader">
            <ScreenLoader
              label={globalLoaderLabel}
              fullscreen={false}
              registerPageLoading={false}
            />
          </div>
        ) : null}
      </main>
    </>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <PageTitleProvider>
      <PageLoadingProvider>
        <MainLayoutContent>{children}</MainLayoutContent>
      </PageLoadingProvider>
    </PageTitleProvider>
  );
}
