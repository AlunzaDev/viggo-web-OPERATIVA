import { useEffect, useMemo, useRef, useState } from "react";
import L, { type Map as LeafletMap, type Marker, type Polygon, type TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaBroadcastTower,
  FaCashRegister,
  FaDoorOpen,
  FaExclamationTriangle,
  FaHashtag,
  FaLayerGroup,
  FaMap,
  FaMapMarkerAlt,
  FaMicrochip,
  FaMinus,
  FaPlus,
  FaPlug,
  FaQrcode,
  FaServer,
  FaSignOutAlt,
  FaSyncAlt,
  FaWifi,
} from "react-icons/fa";
import { CopyableId } from "../../components/shared/CopyableId";
import { UniqueModalBase } from "../../components/shared/modals/UniqueModalBase";
import { type ParkingEntity } from "../../../domain/entities/parking.entity";
import { type ModuleEntity } from "../../../domain/entities/module.entity";
import { usePageTitle } from "../../context/page-title/usePageTitle";
import { ScreenLoader } from "../../components/shared/loading/ScreenLoader";
import {
  formatDateTime,
  getBindingLabel,
  getHeartbeatAgeLabel,
  getModuleTypeLabel,
  getStatusHint,
  getStatusLabel,
  resolveDeviceStatus,
  type DeviceHeartbeatFilter,
} from "./DeviceHeartbeatPage.helpers";
import {
  getFilteredHeartbeatModules,
  getHeartbeatDetailModule,
  getHeartbeatMapMarkers,
  getHeartbeatSelectedModule,
  getHeartbeatStatsSummary,
  loadHeartbeatPageData,
  toValidAreaPoint,
} from "./DeviceHeartbeatPage.flow";
import {
  buildHeartbeatBounds,
  createHeartbeatMapMarkerIcon,
  createHeartbeatPopupContent,
  HEARTBEAT_MAP_CENTER,
  HEARTBEAT_MAP_DEFAULT_ZOOM,
  HEARTBEAT_MAP_PROJECT_MAX_ZOOM,
  recenterHeartbeatMap,
  safelyRefreshHeartbeatMap,
  toHeartbeatMapLatLng,
} from "./device-heartbeat.map";
import { normalizeOperationalUserMessage } from "../../services/operations/operational-state.presenter";
import "./DeviceHeartbeatPage.css";
const MAPTILER_API_KEY = String(import.meta.env.VITE_MAPTILER_API_KEY ?? "").trim();
const OPEN_STREET_MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OPEN_STREET_MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const maptilerTileUrl = (style: "streets-v4-dark") =>
  MAPTILER_API_KEY
    ? `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`
    : null;

const maptilerAttribution = MAPTILER_API_KEY
  ? '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  : OPEN_STREET_MAP_ATTRIBUTION;

const TILE_LAYERS = {
  street: {
    label: "Mapa",
    url: {
      light: OPEN_STREET_MAP_TILE_URL,
      dark: maptilerTileUrl("streets-v4-dark") ?? OPEN_STREET_MAP_TILE_URL,
    },
    attribution: {
      light: OPEN_STREET_MAP_ATTRIBUTION,
      dark: maptilerAttribution,
    },
    maxZoom: 19,
    icon: FaMap,
  },
  satellite: {
    label: "Satelite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
    icon: FaLayerGroup,
  },
} as const;

type TileLayerKey = keyof typeof TILE_LAYERS;

const getCurrentThemeName = () =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
    ? "light"
    : "dark";

const resolveTileLayerUrl = (
  layer: (typeof TILE_LAYERS)[TileLayerKey],
  themeName: "light" | "dark"
) => (typeof layer.url === "string" ? layer.url : layer.url[themeName]);

const resolveTileLayerAttribution = (
  layer: (typeof TILE_LAYERS)[TileLayerKey],
  themeName: "light" | "dark"
) => (typeof layer.attribution === "string" ? layer.attribution : layer.attribution[themeName]);

const FILTERS: Array<{ id: DeviceHeartbeatFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline" },
  { id: "pending", label: "Esperando" },
];

const MARKER_POPUP_CLOSE_DELAY_MS = 140;

const getTypeIcon = (type: string) => {
  if (type === "ENTRADA") return <FaDoorOpen />;
  if (type === "SALIDA") return <FaSignOutAlt />;
  return <FaCashRegister />;
};

const formatCoordinates = (coordinates?: [number, number]) =>
  coordinates
    ? `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`
    : "Sin coordenadas";


export function DeviceHeartbeatPage() {
  usePageTitle("Heartbeat");

  const [mapThemeName, setMapThemeName] = useState<"light" | "dark">(() => getCurrentThemeName());

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const syncTheme = () => setMapThemeName(getCurrentThemeName());
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const [statusFilter, setStatusFilter] =
    useState<DeviceHeartbeatFilter>("all");
  const [linkedProject, setLinkedProject] = useState<ParkingEntity | null>(null);
  const [modules, setModules] = useState<ModuleEntity[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [detailModuleId, setDetailModuleId] = useState<string | null>(null);
  const [isProjectExpanded, setIsProjectExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFocusModuleId, setPendingFocusModuleId] = useState<string | null>(null);
  const [tileLayerKey, setTileLayerKey] = useState<TileLayerKey>("street");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const polygonRef = useRef<Polygon | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const markerCloseTimeoutsRef = useRef<Map<string, number>>(new Map());
  const shouldAutoFitRef = useRef(true);
  const loadHeartbeatRef = useRef<
    (mode?: "initial" | "refresh") => Promise<void>
  >(async () => undefined);

  const loadHeartbeat = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const result = await loadHeartbeatPageData({
        selectedModuleId,
        detailModuleId,
      });
      shouldAutoFitRef.current = true;

      setLinkedProject(result.linkedProject);
      setModules(result.modules);
      setSelectedModuleId(result.selectedModuleId);
      setDetailModuleId(result.detailModuleId);
      setError(null);
    } catch (loadError) {
      const rawMessage =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el heartbeat del proyecto local.";
      setError(normalizeOperationalUserMessage(rawMessage, "heartbeat").message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  loadHeartbeatRef.current = loadHeartbeat;

  useEffect(() => {
    void loadHeartbeatRef.current("initial");
  }, []);

  useEffect(() => {
    shouldAutoFitRef.current = false;
  }, [statusFilter]);

  const filteredModules = useMemo(
    () => getFilteredHeartbeatModules(modules, statusFilter),
    [modules, statusFilter],
  );

  const stats = useMemo(() => getHeartbeatStatsSummary(modules), [modules]);

  const selectedModule = useMemo(
    () => getHeartbeatSelectedModule(filteredModules, selectedModuleId),
    [filteredModules, selectedModuleId],
  );

  const detailModule = useMemo(
    () => getHeartbeatDetailModule(modules, detailModuleId),
    [detailModuleId, modules],
  );

  const mapMarkers = useMemo(
    () => getHeartbeatMapMarkers(filteredModules),
    [filteredModules],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, {
      center: HEARTBEAT_MAP_CENTER,
      zoom: HEARTBEAT_MAP_DEFAULT_ZOOM,
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    }).setView(HEARTBEAT_MAP_CENTER, HEARTBEAT_MAP_DEFAULT_ZOOM);

    const initialLayer = TILE_LAYERS.street;
    tileLayerRef.current = L.tileLayer(resolveTileLayerUrl(initialLayer, mapThemeName), {
      attribution: resolveTileLayerAttribution(initialLayer, mapThemeName),
      maxZoom: initialLayer.maxZoom,
    }).addTo(map);

    mapRef.current = map;
    const markerCloseTimeouts = markerCloseTimeoutsRef.current;

    window.setTimeout(() => {
      map.invalidateSize();
      tileLayerRef.current?.redraw();
    }, 120);

    return () => {
      markerCloseTimeouts.forEach((timeoutId) =>
        window.clearTimeout(timeoutId),
      );
      markerCloseTimeouts.clear();
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      polygonRef.current?.remove();
      polygonRef.current = null;
      tileLayerRef.current?.remove();
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [isLoading]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileLayerRef.current?.remove();
    const layer = TILE_LAYERS[tileLayerKey];
    tileLayerRef.current = L.tileLayer(resolveTileLayerUrl(layer, mapThemeName), {
      attribution: resolveTileLayerAttribution(layer, mapThemeName),
      maxZoom: layer.maxZoom,
    }).addTo(map);
    safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]);
  }, [tileLayerKey, mapThemeName]);

  useEffect(() => {
    if (filteredModules.length === 0) {
      setSelectedModuleId(null);
      return;
    }

    if (
      !selectedModuleId ||
      !filteredModules.some((module) => module.id === selectedModuleId)
    ) {
      setSelectedModuleId(filteredModules[0]?.id ?? null);
    }
  }, [filteredModules, selectedModuleId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    if (linkedProject?.area.length) {
      const latLngs = linkedProject.area
        .map((point) => toValidAreaPoint(point))
        .filter((point): point is [number, number] => Boolean(point));

      if (latLngs.length >= 3) {
        polygonRef.current = L.polygon(latLngs, {
          color: "#1f355f",
          weight: 2,
          fillColor: "#8fb2ff",
          fillOpacity: 0.16,
        }).addTo(map);
      }
    }

    mapMarkers.forEach((item) => {
      let isMarkerHovered = false;
      let isPopupHovered = false;
      const clearCloseTimeout = () => {
        const timeoutId = markerCloseTimeoutsRef.current.get(item.key);
        if (!timeoutId) return;
        window.clearTimeout(timeoutId);
        markerCloseTimeoutsRef.current.delete(item.key);
      };

      const marker = L.marker([item.lat, item.lng], {
        icon: createHeartbeatMapMarkerIcon(item.tone, item.meta.includes("·")),
        zIndexOffset: 1000,
      })
        .bindPopup(
          createHeartbeatPopupContent(item),
          {
            className: "device-heartbeat-leaflet-popup",
            closeButton: true,
            interactive: true,
            offset: [0, -18],
            autoPanPaddingTopLeft: [24, 24],
            autoPanPaddingBottomRight: [24, 24],
          },
        )
        .on("mouseover", () => {
          isMarkerHovered = true;
          clearCloseTimeout();
          marker.openPopup();
        })
        .on("mouseout", (event) => {
          const popupElement = marker.getPopup()?.getElement() ?? null;
          const target = event.originalEvent?.relatedTarget ?? null;

          if (target instanceof Node && popupElement?.contains(target)) {
            isPopupHovered = true;
            return;
          }

          isMarkerHovered = false;
          clearCloseTimeout();

          const timeoutId = window.setTimeout(() => {
            if (
              isMarkerHovered ||
              isPopupHovered ||
              marker.getPopup()?.getElement()?.matches(":hover")
            ) {
              return;
            }
            marker.closePopup();
            markerCloseTimeoutsRef.current.delete(item.key);
          }, MARKER_POPUP_CLOSE_DELAY_MS);

          markerCloseTimeoutsRef.current.set(item.key, timeoutId);
        })
        .on("click", () => {
          clearCloseTimeout();
          marker.openPopup();
          setSelectedModuleId(item.moduleId);
          setDetailModuleId(item.moduleId);
          setPendingFocusModuleId(item.moduleId);
        })
        .on("popupopen", () => {
          const popupElement = marker.getPopup()?.getElement();
          if (!popupElement) return;

          isPopupHovered = popupElement.matches(":hover");
          popupElement.onmouseenter = () => {
            isPopupHovered = true;
            clearCloseTimeout();
          };
          popupElement.onmouseleave = () => {
            isPopupHovered = false;
            clearCloseTimeout();

            const timeoutId = window.setTimeout(() => {
              if (
                isMarkerHovered ||
                isPopupHovered ||
                marker.getPopup()?.getElement()?.matches(":hover")
              ) {
                return;
              }
              marker.closePopup();
              markerCloseTimeoutsRef.current.delete(item.key);
            }, MARKER_POPUP_CLOSE_DELAY_MS);

            markerCloseTimeoutsRef.current.set(item.key, timeoutId);
          };
        })
        .on("popupclose", () => {
          isPopupHovered = false;
          clearCloseTimeout();
        })
        .addTo(map);

      markerRefs.current.push(marker);
    });

    safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]);
  }, [linkedProject, mapMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shouldAutoFitRef.current) return;

    const bounds = buildHeartbeatBounds(linkedProject, mapMarkers);

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [36, 36],
        maxZoom: HEARTBEAT_MAP_PROJECT_MAX_ZOOM,
        animate: false,
      });
      map.once("moveend", () =>
        safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]),
      );
      shouldAutoFitRef.current = false;
      return;
    }

    const projectPoint = toHeartbeatMapLatLng(linkedProject?.coordinates);
    if (projectPoint) {
      map.setView([projectPoint.latitude, projectPoint.longitude], 16, {
        animate: false,
      });
      map.once("moveend", () =>
        safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]),
      );
      shouldAutoFitRef.current = false;
      return;
    }

    map.setView(HEARTBEAT_MAP_CENTER, HEARTBEAT_MAP_DEFAULT_ZOOM, { animate: false });
    map.once("moveend", () =>
      safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]),
    );
    shouldAutoFitRef.current = false;
  }, [linkedProject, mapMarkers]);

  useEffect(() => {
    if (!mapRef.current) return;

    safelyRefreshHeartbeatMap(mapRef.current, tileLayerRef.current, [0, 120]);
  }, [filteredModules.length, isProjectExpanded]);

  useEffect(() => {
    if (!pendingFocusModuleId || !mapRef.current) return;

    const focusTarget =
      modules.find((module) => module.id === pendingFocusModuleId) ?? null;
    if (!focusTarget?.coordinates) {
      setPendingFocusModuleId(null);
      return;
    }

    const focusPoint = toHeartbeatMapLatLng(focusTarget.coordinates);
    if (!focusPoint) {
      setPendingFocusModuleId(null);
      return;
    }

    const map = mapRef.current;
    const targetZoom = Number.isFinite(map.getZoom()) ? Math.max(map.getZoom(), 18) : 18;

    try {
      map.stop();
      map.setView([focusPoint.latitude, focusPoint.longitude], targetZoom, {
        animate: false,
      });
      map.once("moveend", () =>
        safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]),
      );
      safelyRefreshHeartbeatMap(map, tileLayerRef.current, [0, 120]);
    } catch {
      // Ignore invalid transient map states while filters are changing.
    } finally {
      setPendingFocusModuleId(null);
    }
  }, [modules, pendingFocusModuleId]);

  const handleModulePreview = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setPendingFocusModuleId(moduleId);
  };

  const handleModuleDetail = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setDetailModuleId(moduleId);
    setPendingFocusModuleId(moduleId);
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleRecenterMap = () => {
    const map = mapRef.current;
    if (!map) return;

    recenterHeartbeatMap(map, linkedProject, mapMarkers, tileLayerRef.current);
  };

  if (isLoading) {
    return <ScreenLoader label="heartbeat" fullscreen={false} />;
  }

  return (
    <main className="device-heartbeat-page">
      <section className="device-heartbeat-map-shell">
        <div className="device-heartbeat-map-topbar">
          <div>
            <strong>Mapa operativo</strong>
            <span>
              {linkedProject?.ciudad ?? "Sin ciudad"} · {filteredModules.length}{" "}
              modulos visibles
            </span>
          </div>

          <div className="device-heartbeat-map-topbar__stats">
            <span className="is-online">{stats.online} online</span>
            <span className="is-offline">{stats.offline} offline</span>
            <span className="is-pending">{stats.pending} esperando</span>
          </div>
        </div>

        {error ? (
          <p className="device-heartbeat-error">
            <FaExclamationTriangle />
            {error}
          </p>
        ) : null}

        <div className="device-heartbeat-map-panel">
          <div className="device-heartbeat-map-overlay">
            <div
              className="device-heartbeat-map-layer-tabs"
              role="group"
              aria-label="Tipo de mapa"
            >
              {(Object.keys(TILE_LAYERS) as TileLayerKey[]).map((key) => {
                const layer = TILE_LAYERS[key];
                const Icon = layer.icon;

                return (
                  <button
                    key={key}
                    type="button"
                    className={tileLayerKey === key ? "is-active" : ""}
                    onClick={() => setTileLayerKey(key)}
                    aria-pressed={tileLayerKey === key}
                  >
                    <Icon />
                    <span>{layer.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="device-heartbeat-map-status-tabs"
              aria-label="Filtrar dispositivos por estado"
            >
              {FILTERS.map((filter) => {
                const count =
                  filter.id === "all"
                    ? stats.total
                    : filter.id === "online"
                      ? stats.online
                      : filter.id === "offline"
                        ? stats.offline
                        : stats.pending;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`device-heartbeat-map-status-tab device-heartbeat-map-status-tab--${filter.id}${
                      statusFilter === filter.id ? " is-active" : ""
                    }`}
                    onClick={() => setStatusFilter(filter.id)}
                    aria-pressed={statusFilter === filter.id}
                  >
                    <span>{filter.label}</span>
                    <strong>{count}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="device-heartbeat-map-controls"
            role="group"
            aria-label="Controles del mapa"
          >
            <button type="button" onClick={handleZoomIn} aria-label="Acercar mapa">
              <FaPlus />
            </button>
            <button type="button" onClick={handleZoomOut} aria-label="Alejar mapa">
              <FaMinus />
            </button>
            <button type="button" onClick={handleRecenterMap} aria-label="Recentrar mapa">
              <FaMapMarkerAlt />
            </button>
            <button
              type="button"
              onClick={() => void loadHeartbeat("refresh")}
              disabled={isRefreshing}
              aria-label={isRefreshing ? "Actualizando mapa" : "Actualizar mapa"}
            >
              <FaSyncAlt className={isRefreshing ? "is-spinning" : ""} />
            </button>
          </div>

          <div ref={mapElementRef} className="device-heartbeat-map" />

          <div className="device-heartbeat-map-legend">
            <span>
              <i className="is-online" /> Online
            </span>
            <span>
              <i className="is-offline" /> Offline
            </span>
            <span>
              <i className="is-pending" /> Esperando
            </span>
          </div>
        </div>
      </section>

      <section className="device-heartbeat-workspace">
        <header className="device-heartbeat-projects-toolbar">
          <div>
            <span>Proyectos</span>
            <strong>{linkedProject ? "1 visible" : "0 visibles"}</strong>
          </div>
          <div className="device-heartbeat-projects-actions">
            <button type="button" onClick={() => setIsProjectExpanded(true)}>
              Abrir
            </button>
            <button type="button" onClick={() => setIsProjectExpanded(false)}>
              Cerrar
            </button>
          </div>
        </header>

        {linkedProject ? (
          <article
            className={`device-heartbeat-project ${
              isProjectExpanded ? "is-expanded" : "is-collapsed"
            }`}
          >
            <button
              type="button"
              className="device-heartbeat-project__toggle"
              onClick={() => setIsProjectExpanded((value) => !value)}
              aria-expanded={isProjectExpanded}
            >
              <div className="device-heartbeat-project__header">
                <div>
                  <h2>{linkedProject.nombre}</h2>
                  <p>{linkedProject.identificador}</p>
                </div>
                <div className="device-heartbeat-project__summary">
                  <span className="is-offline">{stats.offline} offline</span>
                  <span className="is-online">{stats.online} online</span>
                  <span className="is-pending">{stats.pending} esperando</span>
                </div>
              </div>
              <span className="device-heartbeat-project__chevron">
                {isProjectExpanded ? "˄" : "˅"}
              </span>
            </button>

            {isProjectExpanded ? (
              <div className="device-heartbeat-project__grid">
                {filteredModules.map((module) => {
                  const status = resolveDeviceStatus(module.deviceRuntime);
                  const runtime = module.deviceRuntime;
                  const isSelected = selectedModule?.id === module.id;

                  return (
                    <article
                      key={module.id}
                      className={`device-heartbeat-device-card is-${status}${
                        isSelected ? " is-selected" : ""
                      }`}
                      onClick={() => handleModulePreview(module.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleModulePreview(module.id);
                        }
                      }}
                    >
                      <header>
                        <span className="device-heartbeat-device-card__icon">
                          {getTypeIcon(module.tipo)}
                        </span>
                        <div>
                          <h2>{getModuleTypeLabel(module.tipo)}</h2>
                          <p>{module.nombre || module.identificador}</p>
                        </div>
                      </header>

                      <div className="device-heartbeat-device-card__meta-row">
                        <span className={`device-heartbeat-pill is-${status}`}>
                          {getStatusLabel(status)}
                        </span>
                        <small>{getHeartbeatAgeLabel(runtime?.lastHeartbeatAt)}</small>
                      </div>

                      <div className="device-heartbeat-device-card__summary">
                        <strong>{module.identificador}</strong>
                        <span>
                          {runtime?.lastHeartbeatAt
                            ? formatDateTime(runtime.lastHeartbeatAt)
                            : "Sin heartbeat"}
                        </span>
                      </div>

                      <div className="device-heartbeat-device-card__actions">
                        <button
                          type="button"
                          className="device-heartbeat-device-card__action"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleModulePreview(module.id);
                          }}
                        >
                          Ver en mapa
                        </button>
                        <button
                          type="button"
                          className="device-heartbeat-device-card__action device-heartbeat-device-card__action--primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleModuleDetail(module.id);
                          }}
                        >
                          Abrir detalle
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </article>
        ) : (
          <section className="device-heartbeat-empty device-heartbeat-empty--workspace">
            <FaBroadcastTower />
            <h2>Sin proyecto vinculado</h2>
            <p>
              Esta instalacion todavia no tiene un proyecto local listo para
              monitoreo.
            </p>
          </section>
        )}
      </section>

      <UniqueModalBase
        open={Boolean(detailModule)}
        title="Detalle del dispositivo"
        entityName={
          detailModule?.nombre || detailModule?.identificador || "Dispositivo"
        }
        className="device-heartbeat-detail-modal"
        onClose={() => setDetailModuleId(null)}
        showEditAction={false}
      >
        {detailModule ? (
          <>
            <section className="modal-form-section">
              <div className="modal-section-header">
                <FaServer className="modal-section-icon" />
                <h3 className="modal-section-title">Resumen</h3>
              </div>

              <div className="device-heartbeat-detail-hero">
                <span className="device-heartbeat-detail-hero__icon">
                  {getTypeIcon(detailModule.tipo)}
                </span>
                <div>
                  <h4>{detailModule.nombre}</h4>
                  <p>{detailModule.identificador}</p>
                </div>
                <span
                  className={`device-heartbeat-pill is-${resolveDeviceStatus(
                    detailModule.deviceRuntime,
                  )}`}
                >
                  {getStatusLabel(resolveDeviceStatus(detailModule.deviceRuntime))}
                </span>
              </div>

              <div className="device-heartbeat-detail-copy">
                <CopyableId
                  value={detailModule.id}
                  copyLabel={`Copiar ID de ${detailModule.nombre}`}
                />
              </div>

              <div className="modal-section-grid">
                <article className="form-group admin-crud-detail-item">
                  <label>Proyecto</label>
                  <p>{linkedProject?.nombre || "Sin proyecto"}</p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Tipo</label>
                  <p>{getModuleTypeLabel(detailModule.tipo)}</p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>
                    <FaHashtag /> Identificador
                  </label>
                  <p>{detailModule.identificador}</p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Vinculacion</label>
                  <p>{getBindingLabel(detailModule)}</p>
                </article>
                <article className="form-group modal-field-full admin-crud-detail-item">
                  <label>Estado operativo</label>
                  <p>{getStatusHint(detailModule)}</p>
                </article>
              </div>
            </section>

            <section className="modal-form-section">
              <div className="modal-section-header">
                <FaWifi className="modal-section-icon" />
                <h3 className="modal-section-title">Conexion</h3>
              </div>

              <div className="modal-section-grid">
                <article className="form-group admin-crud-detail-item">
                  <label>Estado de conexion</label>
                  <p>
                    {detailModule.deviceRuntime?.connectionStatus || "Sin runtime"}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Heartbeat</label>
                  <p>
                    {getHeartbeatAgeLabel(
                      detailModule.deviceRuntime?.lastHeartbeatAt,
                    )}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Conectado desde</label>
                  <p>{formatDateTime(detailModule.deviceRuntime?.connectedAt)}</p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Ultimo heartbeat</label>
                  <p>
                    {formatDateTime(detailModule.deviceRuntime?.lastHeartbeatAt)}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Ultima desconexion</label>
                  <p>
                    {formatDateTime(
                      detailModule.deviceRuntime?.lastDisconnectAt,
                    )}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Mensaje</label>
                  <p>{detailModule.deviceRuntime?.message || "Sin mensaje"}</p>
                </article>
              </div>
            </section>

            <section className="modal-form-section">
              <div className="modal-section-header">
                <FaMapMarkerAlt className="modal-section-icon" />
                <h3 className="modal-section-title">Red y ubicacion</h3>
              </div>

              <div className="modal-section-grid">
                <article className="form-group admin-crud-detail-item">
                  <label>IP del modulo</label>
                  <p>
                    {detailModule.ip ||
                      detailModule.deviceRuntime?.ipAddress ||
                      "Sin IP"}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>MAC del modulo</label>
                  <p>
                    {detailModule.mac ||
                      detailModule.deviceBinding?.primaryMac ||
                      "Sin MAC"}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Ubicacion</label>
                  <p>
                    {detailModule.ubicacion ||
                      detailModule.deviceRuntime?.locationLabel ||
                      "Sin ubicacion"}
                  </p>
                </article>
                <article className="form-group admin-crud-detail-item">
                  <label>Coordenadas</label>
                  <p>{formatCoordinates(detailModule.coordinates)}</p>
                </article>
              </div>
            </section>

            <section className="modal-form-section">
              <div className="modal-section-header">
                <FaPlug className="modal-section-icon" />
                <h3 className="modal-section-title">Devices auxiliares</h3>
              </div>

              {detailModule.submodulos.length ? (
                <div className="device-heartbeat-detail-subdevices">
                  {detailModule.submodulos.map((submodule) => (
                    <article
                      key={submodule.submoduloId}
                      className="device-heartbeat-detail-subdevice"
                    >
                      <div>
                        <strong>{submodule.nombre}</strong>
                        <span>{submodule.tipo}</span>
                      </div>
                      <div className="device-heartbeat-detail-subdevice__meta">
                        <small>
                          <FaQrcode /> {submodule.identificador || "Sin identificador"}
                        </small>
                        <small>
                          <FaWifi /> {submodule.ip || "Sin IP"}
                        </small>
                        <small>
                          <FaMapMarkerAlt /> {submodule.ubicacion || "Sin ubicacion"}
                        </small>
                        <small>
                          <FaMicrochip /> {submodule.mac || "Sin MAC"}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-crud-detail-item">
                  <p className="admin-crud-detail-muted">
                    Sin devices auxiliares registrados.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </UniqueModalBase>
    </main>
  );
}
