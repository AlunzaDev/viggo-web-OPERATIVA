const localDateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatLocalDateTime = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "Sin actualización";
  return localDateTimeFormatter.format(value);
};
