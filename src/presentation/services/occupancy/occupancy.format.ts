/** The time of an instant in the parking's time zone ("14:05"); the day too when it is not today. */
export const formatParkingTime = (at: number, zone: string, now = Date.now()) => {
  const day = (value: number) => new Intl.DateTimeFormat("es-MX", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  const time = new Intl.DateTimeFormat("es-MX", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  if (day(at) === day(now)) return time;
  return `${new Intl.DateTimeFormat("es-MX", { timeZone: zone, day: "numeric", month: "short" }).format(at)} ${time}`;
};
