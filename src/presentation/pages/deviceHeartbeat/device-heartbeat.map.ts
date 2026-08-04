import L, {
  type DivIcon,
  type LatLngExpression,
  type Map as LeafletMap,
  type TileLayer,
} from "leaflet";
import { type ParkingEntity } from "../../../domain/entities/parking.entity";
import {
  type DeviceHeartbeatStatus,
} from "./DeviceHeartbeatPage.helpers";
import { type DeviceMapMarker } from "./DeviceHeartbeatPage.flow";

export const HEARTBEAT_MAP_CENTER: LatLngExpression = [23.6345, -102.5528];
export const HEARTBEAT_MAP_DEFAULT_ZOOM = 5.5;
export const HEARTBEAT_MAP_PROJECT_MAX_ZOOM = 18;

const getMarkerTone = (value: DeviceHeartbeatStatus) => {
  if (value === "online") return "#1f9d63";
  if (value === "offline") return "#c44747";
  return "#d59b28";
};

const getPopupTone = (tone: DeviceHeartbeatStatus) => {
  if (tone === "online") return "ok";
  if (tone === "offline") return "error";
  return "syncing";
};

export const createHeartbeatMapMarkerIcon = (
  tone: DeviceHeartbeatStatus,
  compact = false,
): DivIcon =>
  L.divIcon({
    className: "device-heartbeat-map-marker-wrap",
    html: `<span class="device-heartbeat-map-marker${
      compact ? " is-compact" : ""
    }" style="--marker-tone:${getMarkerTone(tone)}"><span></span></span>`,
    iconSize: compact ? [24, 24] : [30, 30],
    iconAnchor: compact ? [12, 12] : [15, 15],
  });

export const createHeartbeatPopupContent = (marker: DeviceMapMarker) => {
  const wrapper = document.createElement("div");
  wrapper.className = "device-heartbeat-map-popup";

  const title = document.createElement("strong");
  title.textContent = marker.label;

  const meta = document.createElement("span");
  meta.textContent = marker.meta;

  const headline = document.createElement("div");
  headline.className = "device-heartbeat-map-popup__headline";

  const statusBadge = document.createElement("span");
  statusBadge.className = `device-heartbeat-map-popup__status-pill device-heartbeat-map-popup__status-pill--${getPopupTone(marker.tone)}`;
  statusBadge.textContent = marker.statusLabel;

  const heartbeat = document.createElement("span");
  heartbeat.className = "device-heartbeat-map-popup__message";
  heartbeat.textContent = marker.heartbeatLabel;

  headline.append(statusBadge, heartbeat);
  wrapper.append(title, meta, headline);

  return wrapper;
};

export const safelyRefreshHeartbeatMap = (
  map: LeafletMap,
  tileLayer: TileLayer | null,
  attempts = [0, 120],
) => {
  attempts.forEach((delay) => {
    window.setTimeout(() => {
      try {
        map.invalidateSize({ pan: false });
        tileLayer?.redraw();
      } catch {
        // Ignore transient redraw issues while the viewport settles.
      }
    }, delay);
  });
};

export const toHeartbeatMapLatLng = (coordinates?: [number, number] | null) => {
  if (!coordinates || coordinates.length < 2) return null;
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return { latitude, longitude };
};

export const toHeartbeatMapAreaPoint = (point: {
  latitude: number;
  longitude: number;
}) => {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return [latitude, longitude] as [number, number];
};

export const buildHeartbeatBounds = (
  linkedProject: ParkingEntity | null,
  mapMarkers: DeviceMapMarker[],
) => {
  const bounds: L.LatLngExpression[] = [];

  if (linkedProject?.area.length) {
    const latLngs = linkedProject.area
      .map((point) => toHeartbeatMapAreaPoint(point))
      .filter((point): point is [number, number] => Boolean(point));

    bounds.push(...latLngs);
  }

  mapMarkers.forEach((item) => {
    bounds.push([item.lat, item.lng]);
  });

  return bounds;
};

export const recenterHeartbeatMap = (
  map: LeafletMap,
  linkedProject: ParkingEntity | null,
  mapMarkers: DeviceMapMarker[],
  tileLayer: TileLayer | null,
) => {
  const bounds = buildHeartbeatBounds(linkedProject, mapMarkers);

  if (bounds.length > 0) {
    map.fitBounds(L.latLngBounds(bounds), {
      padding: [36, 36],
      maxZoom: HEARTBEAT_MAP_PROJECT_MAX_ZOOM,
      animate: false,
    });
    map.once("moveend", () => safelyRefreshHeartbeatMap(map, tileLayer, [0, 120]));
    return;
  }

  const projectPoint = toHeartbeatMapLatLng(linkedProject?.coordinates);
  if (projectPoint) {
    map.setView([projectPoint.latitude, projectPoint.longitude], 16, {
      animate: false,
    });
    map.once("moveend", () => safelyRefreshHeartbeatMap(map, tileLayer, [0, 120]));
    return;
  }

  map.setView(HEARTBEAT_MAP_CENTER, HEARTBEAT_MAP_DEFAULT_ZOOM, { animate: false });
  map.once("moveend", () => safelyRefreshHeartbeatMap(map, tileLayer, [0, 120]));
};
