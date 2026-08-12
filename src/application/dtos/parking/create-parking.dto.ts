export class CreateParkingDto {
    readonly nombre: string;
    readonly coordinates: [number, number];
    readonly ciudad: string;
    readonly identificador: string;
    readonly img?: string;
    readonly descripcion?: string;
    readonly estado: boolean;

    private constructor(options: {
        nombre: string;
        coordinates: [number, number];
        ciudad: string;
        identificador: string;
        img?: string;
        descripcion?: string;
        estado?: boolean;
    }) {
        this.nombre = options.nombre;
        this.coordinates = options.coordinates;
        this.ciudad = options.ciudad;
        this.identificador = options.identificador;
        this.img = options.img;
        this.descripcion = options.descripcion;
        this.estado = options.estado ?? true;
    }

    static create(props: Record<string, unknown>): [string?, CreateParkingDto?] {
        const nombre = String(props.nombre ?? props.name ?? "").trim();
        const ciudad = String(props.ciudad ?? "").trim();
        const identificador = String(props.identificador ?? "").trim();
        const descripcion = String(props.descripcion ?? props.description ?? "").trim();
        const img = String(props.img ?? "").trim();
        const estado = typeof props.estado === "boolean" ? props.estado : true;
        const longitude = Number(props.longitude ?? (Array.isArray(props.coordinates) ? props.coordinates[0] : NaN));
        const latitude = Number(props.latitude ?? (Array.isArray(props.coordinates) ? props.coordinates[1] : NaN));

        if (!nombre) return ["El nombre del proyecto es obligatorio"];
        if (!ciudad) return ["La ciudad del proyecto es obligatoria"];
        if (!identificador) return ["El identificador del proyecto es obligatorio"];
        if (!Number.isFinite(longitude)) return ["La longitud debe ser un numero valido"];
        if (!Number.isFinite(latitude)) return ["La latitud debe ser un numero valido"];

        return [
            undefined,
            new CreateParkingDto({
                nombre,
                coordinates: [longitude, latitude],
                ciudad,
                identificador,
                descripcion: descripcion || undefined,
                img: img || undefined,
                estado,
            }),
        ];
    }
}
