"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface MonthlyPoint {
  label: string;
  Ingresos: number;
  Gastos: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-gray-700">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.payload?.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0ef" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => formatNumber(v)}
        />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "#f7f8f7" }} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar dataKey="Ingresos" fill="#2f8a58" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
        Sin gastos este mes.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((slice) => (
            <Cell key={slice.name} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip content={<TooltipBox />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (
            <span className="text-gray-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
