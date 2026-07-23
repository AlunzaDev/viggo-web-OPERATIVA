import type { ModuleType } from "../../../domain/entities/module.entity";
import type { ModuleFormPayload } from "../../hooks/modules/useModules";

export type ProyectoOption = {
  id: string;
  nombre: string;
};

export type ModuloForm = {
  nombre: string;
  proyecto: string;
  tipo: ModuleType;
  identificador: string;
  descripcion: string;
  estado: boolean;
};

export const INITIAL_FORM: ModuloForm = {
  nombre: "",
  proyecto: "",
  tipo: "ENTRADA",
  identificador: "",
  descripcion: "",
  estado: true,
};

export const buildPayload = (form: ModuloForm): ModuleFormPayload => ({
  nombre: form.nombre.trim(),
  proyecto: form.proyecto,
  tipo: form.tipo,
  identificador: form.identificador.trim(),
  descripcion: form.descripcion.trim() || undefined,
  estado: form.estado,
});
