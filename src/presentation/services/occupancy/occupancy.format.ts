/** "45 min", "2 h 05 min", "3 d 4 h": how long a car has been inside. */
export const formatStay = (minutes: number) => {
  const total = Math.max(0, Math.floor(minutes));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  if (hours < 24) return `${hours} h ${String(total % 60).padStart(2, "0")} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
};

/** The time of an instant in the parking's time zone ("14:05"); the day too when it is not today. */
export const formatParkingTime = (at: number, zone: string, now = Date.now()) => {
  const day = (value: number) => new Intl.DateTimeFormat("es-MX", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  const time = new Intl.DateTimeFormat("es-MX", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  if (day(at) === day(now)) return time;
  return `${new Intl.DateTimeFormat("es-MX", { timeZone: zone, day: "numeric", month: "short" }).format(at)} ${time}`;
};

/** How full, as the tone of the occupancy card. */
export const occupancyTone = (percent: number | null): "neutral" | "success" | "warning" | "danger" => {
  if (percent === null) return "neutral";
  if (percent >= 95) return "danger";
  if (percent >= 80) return "warning";
  return "success";
};
