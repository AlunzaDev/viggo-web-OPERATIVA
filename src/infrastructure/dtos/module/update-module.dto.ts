import type { ModuleType } from "../../../domain/entities/module.entity";

const VALID_MODULE_TYPES: ModuleType[] = ["ENTRADA", "SALIDA", "POS"];

export class UpdateModuleDto {
    readonly id: string;
    readonly nombre?: string;
    readonly proyecto?: string;
    readonly tipo?: ModuleType;
    readonly identificador?: string;
    readonly descripcion?: string;
    readonly estado?: boolean;

    private constructor(options: {
        id: string;
        nombre?: string;
        proyecto?: string;
        tipo?: ModuleType;
        identificador?: string;
        descripcion?: string;
        estado?: boolean;
    }) {
        this.id = options.id;
        this.nombre = options.nombre;
        this.proyecto = options.proyecto;
        this.tipo = options.tipo;
        this.identificador = options.identificador;
        this.descripcion = options.descripcion;
        this.estado = options.estado;
    }

    static create(props: Record<string, unknown>): [string?, UpdateModuleDto?] {
        const id = String(props.id ?? "").trim();
        if (!id) return ["Missing id in UpdateModuleDto"];

        const tipo =
            typeof props.tipo === "string" || typeof props.type === "string"
                ? String(props.tipo ?? props.type).trim().toUpperCase()
                : undefined;

        if (tipo && !VALID_MODULE_TYPES.includes(tipo as ModuleType)) {
            return ["El tipo del modulo no es valido"];
        }

        return [
            undefined,
            new UpdateModuleDto({
                id,
                nombre:
                    typeof props.nombre === "string"
                        ? props.nombre.trim()
                        : typeof props.name === "string"
                          ? props.name.trim()
                          : undefined,
                proyecto:
                    typeof props.proyecto === "string"
                        ? props.proyecto.trim()
                        : typeof props.projectId === "string"
                          ? props.projectId.trim()
                          : undefined,
                tipo: tipo as ModuleType | undefined,
                identificador:
                    typeof props.identificador === "string"
                        ? props.identificador.trim()
                        : undefined,
                descripcion:
                    typeof props.descripcion === "string"
                        ? props.descripcion.trim()
                        : typeof props.description === "string"
                          ? props.description.trim()
                          : undefined,
                estado: typeof props.estado === "boolean" ? props.estado : undefined,
            }),
        ];
    }
}
