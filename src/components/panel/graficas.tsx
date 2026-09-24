"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETA = ["#9170F5", "#6A2CAB", "#C7A6F7", "#F7C8E0", "#55208B"];

const ejeComun = {
  stroke: "#9170F5",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const estiloTooltip = {
  borderRadius: 18,
  border: "1px solid #E9D6FF",
  boxShadow: "0 12px 40px -14px rgba(106,44,171,0.28)",
  fontSize: 12,
  fontFamily: "inherit",
  padding: "10px 14px",
} as const;

export function GraficaArea({
  datos,
  clave,
  etiqueta,
  unidad = "",
  alto = 280,
}: {
  datos: { fecha: string; [k: string]: string | number | null }[];
  clave: string;
  etiqueta: string;
  unidad?: string;
  alto?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <AreaChart data={datos} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${clave}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9170F5" stopOpacity={0.42} />
            <stop offset="100%" stopColor="#9170F5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke="#E9D6FF" vertical={false} />
        <XAxis dataKey="fecha" {...ejeComun} />
        <YAxis {...ejeComun} domain={["auto", "auto"]} width={46} />
        <Tooltip
          contentStyle={estiloTooltip}
          formatter={(v) => [`${v ?? "—"}${unidad}`, etiqueta]}
        />
        <Area
          type="monotone"
          dataKey={clave}
          name={etiqueta}
          stroke="#6A2CAB"
          strokeWidth={2.5}
          fill={`url(#grad-${clave})`}
          dot={{ r: 3.5, fill: "#6A2CAB", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#9170F5" }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GraficaLineas({
  datos,
  series,
  alto = 300,
}: {
  datos: { fecha: string; [k: string]: string | number | null }[];
  series: { clave: string; etiqueta: string }[];
  alto?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <LineChart data={datos} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 6" stroke="#E9D6FF" vertical={false} />
        <XAxis dataKey="fecha" {...ejeComun} />
        <YAxis {...ejeComun} domain={["auto", "auto"]} width={46} />
        <Tooltip contentStyle={estiloTooltip} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
        />
        {series.map((s, i) => (
          <Line
            key={s.clave}
            type="monotone"
            dataKey={s.clave}
            name={s.etiqueta}
            stroke={PALETA[i % PALETA.length]}
            strokeWidth={2.2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GraficaBarras({
  datos,
  clave,
  etiqueta,
  alto = 260,
}: {
  datos: { fecha: string; [k: string]: string | number | null }[];
  clave: string;
  etiqueta: string;
  alto?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 6" stroke="#E9D6FF" vertical={false} />
        <XAxis dataKey="fecha" {...ejeComun} />
        <YAxis {...ejeComun} allowDecimals={false} width={46} />
        <Tooltip
          cursor={{ fill: "#F3EAFF" }}
          contentStyle={estiloTooltip}
          formatter={(v) => [`${v ?? "—"}`, etiqueta]}
        />
        <Bar dataKey={clave} name={etiqueta} fill="#9170F5" radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
