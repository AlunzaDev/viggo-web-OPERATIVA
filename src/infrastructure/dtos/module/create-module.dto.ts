import type { ModuleType } from "../../../domain/entities/module.entity";

const VALID_MODULE_TYPES: ModuleType[] = ["ENTRADA", "SALIDA", "POS"];

export class CreateModuleDto {
    readonly nombre: string;
    readonly proyecto: string;
    readonly tipo: ModuleType;
    readonly identificador: string;
    readonly descripcion?: string;
    readonly estado: boolean;

    private constructor(options: {
        nombre: string;
        proyecto: string;
        tipo: ModuleType;
        identificador: string;
        descripcion?: string;
        estado?: boolean;
    }) {
        this.nombre = options.nombre;
        this.proyecto = options.proyecto;
        this.tipo = options.tipo;
        this.identificador = options.identificador;
        this.descripcion = options.descripcion;
        this.estado = options.estado ?? true;
    }

    static create(props: Record<string, unknown>): [string?, CreateModuleDto?] {
        const nombre = String(props.nombre ?? props.name ?? "").trim();
        const proyecto = String(props.proyecto ?? props.projectId ?? "").trim();
        const tipo = String(props.tipo ?? props.type ?? "ENTRADA").trim().toUpperCase() as ModuleType;
        const identificador = String(props.identificador ?? "").trim();
        const descripcion = String(props.descripcion ?? props.description ?? "").trim();
        const estado = typeof props.estado === "boolean" ? props.estado : true;

        if (!nombre) return ["El nombre del modulo es obligatorio"];
        if (!proyecto) return ["El proyecto del modulo es obligatorio"];
        if (!VALID_MODULE_TYPES.includes(tipo)) return ["El tipo del modulo no es valido"];
        if (!identificador) return ["El identificador del modulo es obligatorio"];

        return [
            undefined,
            new CreateModuleDto({
                nombre,
                proyecto,
                tipo,
                identificador,
                descripcion: descripcion || undefined,
                estado,
            }),
        ];
    }
}
