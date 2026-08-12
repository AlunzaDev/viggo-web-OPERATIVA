export type ProjectCoordinates = [number, number];
export type ProjectAreaPoint = {
    latitude: number;
    longitude: number;
};

export const REMOTE_SUPPORT_PROVIDERS = [
    "MESHCENTRAL",
    "RUSTDESK",
    "VIGGO_REMOTE",
    "CUSTOM",
] as const;

export type ProjectRemoteSupportProvider = (typeof REMOTE_SUPPORT_PROVIDERS)[number];

export type ProjectRemoteSupport = {
    provider: ProjectRemoteSupportProvider;
    enabled: boolean;
    baseUrl: string;
};

export class ParkingEntity {
    readonly id: string;
    readonly nombre: string;
    readonly coordinates: ProjectCoordinates;
    readonly area: ProjectAreaPoint[];
    readonly ciudad: string;
    readonly identificador: string;
    readonly remoteSupport: ProjectRemoteSupport | null;
    readonly img: string;
    readonly descripcion: string;
    readonly estado: boolean;

    constructor(options: {
        id: string;
        nombre: string;
        coordinates: ProjectCoordinates;
        area?: ProjectAreaPoint[];
        ciudad: string;
        identificador: string;
        remoteSupport?: ProjectRemoteSupport | null;
        img?: string;
        descripcion?: string;
        estado?: boolean;
    }) {
        this.id = options.id;
        this.nombre = options.nombre;
        this.coordinates = options.coordinates;
        this.area = options.area ?? [];
        this.ciudad = options.ciudad;
        this.identificador = options.identificador;
        this.remoteSupport = options.remoteSupport ?? null;
        this.img = options.img ?? "";
        this.descripcion = options.descripcion ?? "";
        this.estado = options.estado ?? true;
    }

    get name() {
        return this.nombre;
    }

    get description() {
        return this.descripcion;
    }

    get active() {
        return this.estado;
    }

    get latitude() {
        return this.coordinates[1];
    }

    get longitude() {
        return this.coordinates[0];
    }

    static fromObject(object: Record<string, unknown>): ParkingEntity {
        const id = String(object.id ?? object._id ?? object.uid ?? "").trim();
        const nombre = String(object.nombre ?? object.name ?? "").trim();
        const ciudad = String(object.ciudad ?? "").trim();
        const identificador = String(object.identificador ?? "").trim();
        const remoteSupport = ParkingEntity.parseRemoteSupport(object.remoteSupport);
        const area = ParkingEntity.parseArea(object.coordinates);
        const coordinates = ParkingEntity.resolveCenter(area, ParkingEntity.parseCoordinates(object.coordinates));
        const img = String(object.img ?? "").trim();
        const descripcion = String(object.descripcion ?? object.description ?? "").trim();
        const estado = ParkingEntity.parseEstado(object.estado ?? object.active ?? object.state);

        if (!id) throw new Error("El proyecto no incluyo id");
        if (!nombre) throw new Error("El proyecto no incluyo nombre");
        if (!ciudad) throw new Error("El proyecto no incluyo ciudad");
        if (!identificador) throw new Error("El proyecto no incluyo identificador");

        return new ParkingEntity({
            id,
            nombre,
            coordinates,
            area,
            ciudad,
            identificador,
            remoteSupport,
            img,
            descripcion,
            estado,
        });
    }

    static withActive(project: ParkingEntity, estado: boolean): ParkingEntity {
        return new ParkingEntity({
            id: project.id,
            nombre: project.nombre,
            coordinates: project.coordinates,
            area: project.area,
            ciudad: project.ciudad,
            identificador: project.identificador,
            remoteSupport: project.remoteSupport,
            img: project.img,
            descripcion: project.descripcion,
            estado,
        });
    }

    private static parseCoordinates(value: unknown): ProjectCoordinates {
        if (Array.isArray(value) && value.length >= 2) {
            const longitude = Number(value[0]);
            const latitude = Number(value[1]);
            if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
                return [longitude, latitude];
            }
        }

        return [0, 0];
    }

    private static parseRemoteSupport(value: unknown): ProjectRemoteSupport | null {
        if (!value || typeof value !== "object" || Array.isArray(value)) return null;

        const source = value as Record<string, unknown>;
        const provider = String(source.provider ?? "MESHCENTRAL").trim().toUpperCase();
        const baseUrl = String(source.baseUrl ?? "").trim();
        const enabled = Boolean(source.enabled) || baseUrl.length > 0;

        if (!REMOTE_SUPPORT_PROVIDERS.includes(provider as ProjectRemoteSupportProvider)) return null;
        if (!enabled && !baseUrl) return null;

        return {
            provider: provider as ProjectRemoteSupportProvider,
            enabled,
            baseUrl,
        };
    }

    private static parseArea(value: unknown): ProjectAreaPoint[] {
        if (!Array.isArray(value)) return [];

        const source =
            Array.isArray(value[0]) && Array.isArray((value[0] as unknown[])[0])
                ? (value[0] as unknown[])
                : value;

        const points = source
            .map((point) => ParkingEntity.parseAreaPoint(point))
            .filter((point): point is ProjectAreaPoint => Boolean(point));

        return points.length >= 3 ? points : [];
    }

    private static parseAreaPoint(value: unknown): ProjectAreaPoint | null {
        if (Array.isArray(value) && value.length >= 2) {
            const longitude = Number(value[0]);
            const latitude = Number(value[1]);
            if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
                return { latitude, longitude };
            }
        }

        return null;
    }

    private static resolveCenter(
        area: ProjectAreaPoint[],
        fallback: ProjectCoordinates,
    ): ProjectCoordinates {
        if (!area.length) return fallback;

        const totals = area.reduce(
            (accumulator, point) => ({
                latitude: accumulator.latitude + point.latitude,
                longitude: accumulator.longitude + point.longitude,
            }),
            { latitude: 0, longitude: 0 },
        );

        return [
            totals.longitude / area.length,
            totals.latitude / area.length,
        ];
    }

    private static parseEstado(value: unknown): boolean {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["false", "inactive", "inactivo", "disabled", "0"].includes(normalized)) return false;
            if (["true", "active", "activo", "enabled", "1"].includes(normalized)) return true;
        }
        return true;
    }
}
