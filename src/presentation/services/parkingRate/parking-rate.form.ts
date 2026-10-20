import type { ParkingRateRules } from "./parking-rate.api";

/** The rate as the form edits it: text fields. */
export type ParkingRateForm = {
  toleranceMinutes: string;
  firstBlockMinutes: string;
  firstBlockPrice: string;
  fractionMinutes: string;
  fractionPrice: string;
  /** Empty: no daily cap. */
  dailyMax: string;
};

/** A common starting point: 15 min free, first hour $20, every 15 min $5, at most $150 a day. */
export const DEFAULT_RATE_FORM: ParkingRateForm = {
  toleranceMinutes: "15",
  firstBlockMinutes: "60",
  firstBlockPrice: "20",
  fractionMinutes: "15",
  fractionPrice: "5",
  dailyMax: "150",
};

export const rulesToForm = (rules: ParkingRateRules): ParkingRateForm => ({
  toleranceMinutes: String(rules.toleranceMinutes),
  firstBlockMinutes: String(rules.firstBlockMinutes),
  firstBlockPrice: String(rules.firstBlockPrice),
  fractionMinutes: String(rules.fractionMinutes),
  fractionPrice: String(rules.fractionPrice),
  dailyMax: rules.dailyMax === null ? "" : String(rules.dailyMax),
});

const MINUTES = /^\d{1,4}$/;
const MONEY = /^\d{1,6}(\.\d{1,2})?$/;

/**
 * Form -> rules, or the first problem in words. The server checks the same rules; this only
 * avoids sending what cannot be valid and lets the calculator follow the draft.
 */
export const formToRules = (form: ParkingRateForm): { rules: ParkingRateRules } | { error: string } => {
  const text = (value: string) => value.trim().replace(",", ".");
  for (const [field, label] of [["toleranceMinutes", "La tolerancia"], ["firstBlockMinutes", "El primer bloque"], ["fractionMinutes", "La fracción"]] as const) {
    if (!MINUTES.test(text(form[field]))) return { error: `${label} debe ser un número entero de minutos` };
  }
  for (const [field, label] of [["firstBlockPrice", "El precio del primer bloque"], ["fractionPrice", "El precio de la fracción"]] as const) {
    if (!MONEY.test(text(form[field]))) return { error: `${label} debe ser un monto con hasta 2 decimales` };
  }
  if (text(form.dailyMax) && !MONEY.test(text(form.dailyMax))) return { error: "El tope diario debe ser un monto con hasta 2 decimales, o vacío" };

  const rules: ParkingRateRules = {
    toleranceMinutes: Number(text(form.toleranceMinutes)),
    firstBlockMinutes: Number(text(form.firstBlockMinutes)),
    firstBlockPrice: Number(text(form.firstBlockPrice)),
    fractionMinutes: Number(text(form.fractionMinutes)),
    fractionPrice: Number(text(form.fractionPrice)),
    dailyMax: text(form.dailyMax) ? Number(text(form.dailyMax)) : null,
  };
  if (rules.firstBlockMinutes < 1 || rules.firstBlockMinutes > 1440) return { error: "El primer bloque debe ser de 1 a 1440 minutos" };
  if (rules.fractionMinutes < 1 || rules.fractionMinutes > 1440) return { error: "La fracción debe ser de 1 a 1440 minutos" };
  if (rules.toleranceMinutes >= rules.firstBlockMinutes) return { error: "La tolerancia debe ser menor que el primer bloque" };
  if (rules.firstBlockPrice <= 0) return { error: "El primer bloque debe costar más de $0" };
  if (rules.dailyMax !== null && rules.dailyMax < rules.firstBlockPrice) return { error: "El tope diario no puede ser menor que el primer bloque" };
  return { rules };
};

/** "2 h 30 min" -> minutes for the calculator. */
export const toMinutes = (hours: string, minutes: string) => {
  const h = Number(hours || 0);
  const m = Number(minutes || 0);
  return Number.isInteger(h) && Number.isInteger(m) && h >= 0 && m >= 0 ? h * 60 + m : null;
};

export const formatMoney = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
