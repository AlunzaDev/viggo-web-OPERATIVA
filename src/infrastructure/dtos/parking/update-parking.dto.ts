export class UpdateParkingDto {
    readonly id: string;
    readonly nombre?: string;
    readonly coordinates?: [number, number];
    readonly ciudad?: string;
    readonly identificador?: string;
    readonly img?: string;
    readonly descripcion?: string;
    readonly estado?: boolean;

    private constructor(options: {
        id: string;
        nombre?: string;
        coordinates?: [number, number];
        ciudad?: string;
        identificador?: string;
        img?: string;
        descripcion?: string;
        estado?: boolean;
    }) {
        this.id = options.id;
        this.nombre = options.nombre;
        this.coordinates = options.coordinates;
        this.ciudad = options.ciudad;
        this.identificador = options.identificador;
        this.img = options.img;
        this.descripcion = options.descripcion;
        this.estado = options.estado;
    }

    static create(props: Record<string, unknown>): [string?, UpdateParkingDto?] {
        const id = String(props.id ?? "").trim();
        const nombre = typeof props.nombre === "string" ? props.nombre.trim() : typeof props.name === "string" ? props.name.trim() : undefined;
        const ciudad = typeof props.ciudad === "string" ? props.ciudad.trim() : undefined;
        const identificador = typeof props.identificador === "string" ? props.identificador.trim() : undefined;
        const descripcion =
            typeof props.descripcion === "string"
                ? props.descripcion.trim()
                : typeof props.description === "string"
                  ? props.description.trim()
                  : undefined;
        const img = typeof props.img === "string" ? props.img.trim() : undefined;
        const estado = typeof props.estado === "boolean" ? props.estado : undefined;

        if (!id) return ["Missing id in UpdateParkingDto"];

        let coordinates: [number, number] | undefined;
        if (props.longitude !== undefined || props.latitude !== undefined || props.coordinates !== undefined) {
            const longitude = Number(props.longitude ?? (Array.isArray(props.coordinates) ? props.coordinates[0] : NaN));
            const latitude = Number(props.latitude ?? (Array.isArray(props.coordinates) ? props.coordinates[1] : NaN));
            if (!Number.isFinite(longitude)) return ["La longitud debe ser un numero valido"];
            if (!Number.isFinite(latitude)) return ["La latitud debe ser un numero valido"];
            coordinates = [longitude, latitude];
        }

        return [
            undefined,
            new UpdateParkingDto({
                id,
                nombre,
                coordinates,
                ciudad,
                identificador,
                descripcion,
                img,
                estado,
            }),
        ];
    }
}
