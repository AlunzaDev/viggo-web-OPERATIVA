import { api } from "../../../infrastructure/http/axios.instance";

export type ParkingRateRules = {
  toleranceMinutes: number;
  firstBlockMinutes: number;
  firstBlockPrice: number;
  fractionMinutes: number;
  fractionPrice: number;
  /** null: no daily cap. */
  dailyMax: number | null;
};

export type ParkingRate = ParkingRateRules & {
  id: string;
  version: number;
  createdBy: string;
  createdAt: number;
};

export type ParkingRateState = {
  tarifa: ParkingRate | null;
  /** false: no rate saved yet, the legacy $10/$20 applies. */
  configurada: boolean;
  descripcion: string;
};

export type FeeLine = { concept: string; amount: number };
export type ParkingFeeSimulation = { minutes: number; amount: number; lines: FeeLine[] };

export const getParkingRate = async (): Promise<ParkingRateState> => {
  const { data } = await api.get("/api/tarifa");
  return data as ParkingRateState;
};

export const saveParkingRate = async (rules: ParkingRateRules): Promise<ParkingRateState> => {
  const { data } = await api.put("/api/tarifa", rules);
  return data as ParkingRateState;
};

export const getParkingRateHistory = async () => {
  const { data } = await api.get("/api/tarifa/historial");
  return (Array.isArray(data?.historial) ? data.historial : []) as Array<ParkingRate & { descripcion: string }>;
};

/** What a stay would cost: with `rules` (a draft not saved yet) or with the current rate. */
export const simulateParkingFee = async (minutes: number, rules?: ParkingRateRules): Promise<ParkingFeeSimulation> => {
  const { data } = await api.post("/api/tarifa/simular", { minutes, ...(rules ? { rules } : {}) });
  return data as ParkingFeeSimulation;
};
