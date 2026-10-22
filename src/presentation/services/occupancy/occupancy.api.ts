import { api } from "../../../infrastructure/http/axios.instance";

/** GET /api/ocupacion: how full this installation's parking is (viggo-server-api-LOCAL-OPERATIVA#22). */
export type Occupancy = {
  generadoEn: number;
  zonaHoraria: string;
  ahora: {
    autosDentro: number;
    tickets: number;
    pensionados: number;
    /** null while the capacity is not captured in ADMINISTRATIVO. */
    capacidad: number | null;
    porcentaje: number | null;
    lugaresLibres: number | null;
  };
  hoy: { horas: Array<{ hora: string; dentro: number; entradas: number; salidas: number }> };
  ticketsAbiertos: {
    total: number;
    items: Array<{ id: string; idBoleto: string; horaInicio: number; pagado: boolean; monto: number; minutosDentro: number; olvidado: boolean }>;
  };
  pensionadosDentro: {
    total: number;
    items: Array<{ pensionPassId: string; idPass: string; nombre: string; titular: string | null; pension: string; desde: number | null }>;
  };
};

export const getOccupancy = async (): Promise<Occupancy> => (await api.get<Occupancy>("/api/ocupacion")).data;
