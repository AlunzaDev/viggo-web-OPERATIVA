export type ProjectCoordinates = [number, number];

export class ParkingEntity {
    readonly id: string;
    readonly nombre: string;
    readonly coordinates: ProjectCoordinates;
    readonly ciudad: string;
    readonly identificador: string;
    readonly img: string;
    readonly descripcion: string;
    readonly estado: boolean;

    constructor(options: {
        id: string;
        nombre: string;
        coordinates: ProjectCoordinates;
        ciudad: string;
        identificador: string;
        img?: string;
        descripcion?: string;
        estado?: boolean;
    }) {
        this.id = options.id;
        this.nombre = options.nombre;
        this.coordinates = options.coordinates;
        this.ciudad = options.ciudad;
        this.identificador = options.identificador;
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
        const coordinates = ParkingEntity.parseCoordinates(object.coordinates);
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
            ciudad,
            identificador,
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
            ciudad: project.ciudad,
            identificador: project.identificador,
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
