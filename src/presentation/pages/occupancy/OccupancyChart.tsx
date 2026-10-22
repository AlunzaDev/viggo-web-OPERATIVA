import { Area, Bar, CartesianGrid, ComposedChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Occupancy } from "../../services/occupancy/occupancy.api";

type Hour = Occupancy["hoy"]["horas"][number];

const LABELS: Record<string, string> = { dentro: "Autos dentro", entradas: "Entradas", salidas: "Salidas" };

/** Today's hours: cars inside at the start of each hour (area), entries and exits (bars), capacity (line). */
export function OccupancyChart({ hours, capacity }: { hours: Hour[]; capacity: number | null }) {
  const top = Math.max(1, capacity ?? 0, ...hours.map((hour) => Math.max(hour.dentro, hour.entradas, hour.salidas)));
  return <div className="occupancy-chart" role="img"
    aria-label={`Ocupación de hoy por hora: ${hours.map((hour) => `${hour.hora} ${hour.dentro} dentro`).join(", ")}`}>
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={hours} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="occupancy-inside" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--input-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hora" tickFormatter={(hora: string) => hora.slice(0, 2)} tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--input-border)" }} tickLine={false} />
        <YAxis allowDecimals={false} domain={[0, Math.ceil(top * 1.1)]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--glass-bg-strong, var(--input-bg))", border: "1px solid var(--input-border)", borderRadius: 10, color: "var(--text)" }}
          labelFormatter={(hora) => `${hora} h`}
          formatter={(value, name) => [Number(value).toLocaleString("es-MX"), LABELS[String(name)] ?? String(name)]} />
        <Legend formatter={(name: string) => LABELS[name] ?? name} wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
        {capacity !== null
          ? <ReferenceLine y={capacity} stroke="var(--error-color)" strokeDasharray="6 4"
            label={{ value: `Capacidad ${capacity.toLocaleString("es-MX")}`, position: "insideTopRight", fill: "var(--error-color)", fontSize: 12 }} />
          : null}
        <Bar dataKey="entradas" fill="var(--success-color)" barSize={8} radius={[3, 3, 0, 0]} />
        <Bar dataKey="salidas" fill="var(--text-muted)" barSize={8} radius={[3, 3, 0, 0]} />
        <Area dataKey="dentro" type="monotone" stroke="var(--primary-color)" strokeWidth={2} fill="url(#occupancy-inside)" />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}
